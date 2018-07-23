// configure INPUT

// poll INPUT

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <fcntl.h>
#include <poll.h>
#include <time.h>
#include <inttypes.h>
#include <pthread.h>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/un.h>

#include <errno.h>
#include <string.h>

#include "buttons.h"


int main(int argc, char *argv[]) {
  int l, gpioCount;
  buttonDefinition * buttons[MAX_BUTTONS];
  pthread_t buttonThread;
  pthread_t socketThread;
  int clients[MAX_CLIENTS];


  // TODO these need to come from a config file or command line args
  const char * gpios[] = {
    "17",
    "27"
  };
  gpioCount = 2;

  // init client file descriptors
  for(l = 0; l < MAX_CLIENTS; l++) {
    clients[l] = -1;
  }
  pthread_create(&socketThread, NULL, &socketServer, &clients);

  // init buttons
  for(l = 0; l < gpioCount; l++) {
    buttons[l] = (buttonDefinition *)malloc(sizeof(buttonDefinition));
    buttons[l]->gpio = gpios[l];
    pthread_mutex_init(&buttons[l]->lockControl, NULL);
    pthread_barrier_init(&buttons[l]->barrierControl, NULL, 2);
    buttons[l]->clients = clients;
    pthread_create(&buttons[l]->parent, NULL, &buttonParent, buttons[l]);
  }

  // TODO can all threads be monitored simultaneously and restart if one fails?
  for(l = 0; l < gpioCount; l++) {
    pthread_join(buttons[l]->parent, NULL);
  }

}


void * buttonParent(void * args) {
  buttonDefinition * button;
  button = (buttonDefinition *)args;
  char buff[30];
  struct pollfd pollfdStruct;
  int pollStatus;
  uint8_t c;

  sprintf(buff, "/sys/class/gpio/gpio%s/value", button->gpio);
  if ((button->fd = open(buff, O_RDWR)) < 0) {
    printf("Failed to open gpio%d.\n", button->gpio);
    exit(1);
  }

  // configure polling structure
  pollfdStruct.fd = button->fd;
  pollfdStruct.events = POLLPRI | POLLERR;

  // configure button structure
  button->state = STATE_INIT;
  button->debounceState = INACTIVE;
  button->value = RELEASED;

  // clear out any waiting gpio values
  pollStatus = poll(&pollfdStruct, 1, 10); // 10 millisecond wait for input
  if (pollStatus > 0) {
    if (pollfdStruct.revents & POLLPRI) {
      lseek (pollfdStruct.fd, 0, SEEK_SET) ;	// Rewind
      (void)read (pollfdStruct.fd, &c, 1) ;	// Read & clear
    }
  }

  // reset button state
  button->state = STATE_IDLE;
  pthread_mutex_lock(&button->lockControl);
  pthread_create(&button->child, NULL, &buttonChild, button);

  for(;;) {
    pollStatus = poll(&pollfdStruct, 1, -1) ;
    if (pollStatus > 0) {
        if (pollfdStruct.revents & POLLPRI) {
          lseek (pollfdStruct.fd, 0, SEEK_SET) ;	// Rewind
          (void)read (pollfdStruct.fd, &c, 1) ;	// Read & clear

          button->lastValue = c;

          if (button->debounceState == INACTIVE) {
            // when not in a debounce state then signal child about button change
            pthread_mutex_unlock(&button->lockControl); // signal child button event has started
            pthread_barrier_wait(&button->barrierControl); // wait on begin sychronization
            pthread_mutex_lock(&button->lockControl); // regain lock for next event
            pthread_barrier_wait(&button->barrierControl); // signal child synchronized
          }
          else {
            // TODO do we need to do anything if in debounce? probably not.
          }
        }

    }
    else {
      // something wrong with poll status

    }
  }
}


void * buttonChild(void * args) {
  buttonDefinition * button;
  button = (buttonDefinition *)args;
  int lockStatus, startDebounce = 0;
  long lockTimeout = TIMEOUT_FALSE;
  char eventMsg[EVENT_MSG_MAX_LENGTH];

  // main loop
  for(;;) {
    // wait for next event, unlock or timeout
    if (lockTimeout) {
      lockStatus = pthread_mutex_timedlock(&button->lockControl, &button->conditionTime);
    }
    else {
      lockStatus = pthread_mutex_lock(&button->lockControl); // wait for parent to signal button event started
    }

    lockTimeout = TIMEOUT_FALSE;
    if (lockStatus != ETIMEDOUT && button->debounceState == INACTIVE) {
      // not a timeout and not in debounce state, start debounce of button value
      button->debounceState = ACTIVE;
      button->value = button->lastValue;
      clock_gettime(CLOCK_REALTIME, &button->lastTime);
      setConditionNS(&button->lastTime, &button->conditionTime, DEBOUNCE_NS);
      lockTimeout = TIMEOUT_TRUE;
      emitFormattedMessage(eventMsg, EVENT_STRING[button_changed], button);
    }
    else if (lockStatus == ETIMEDOUT && button->debounceState == ACTIVE) {
      button->debounceState = INACTIVE;
      // timed out while in the debounce state, perform state transition
      switch(button->state) {
        case STATE_IDLE:
        if (button->value == PRESSED && button->lastValue == PRESSED) {
          // button pressed and held
          button->state = STATE_PRESSED;
          emitFormattedMessage(eventMsg, EVENT_STRING[button_press], button);
          setConditionNS(&button->lastTime, &button->conditionTime, PRESSED_NS);
          lockTimeout = TIMEOUT_TRUE;
        }
        else if (button->value == PRESSED) {
          // button pressed and released within debounce
          emitFormattedMessage(eventMsg, EVENT_STRING[button_press], button);
          emitFormattedMessage(eventMsg, EVENT_STRING[button_release], button);
          button->state = STATE_CLICKED;
          setConditionNS(&button->lastTime, &button->conditionTime, CLICKED_NS);
          lockTimeout = TIMEOUT_TRUE;
        }
        break;

        case STATE_PRESSED:
        if (button->lastValue == RELEASED) {
          // button released
          emitFormattedMessage(eventMsg, EVENT_STRING[button_release], button);
          button->state = STATE_CLICKED;
          setConditionNS(&button->lastTime, &button->conditionTime, CLICKED_NS);
          lockTimeout = TIMEOUT_TRUE;
        }
        else if (button->value == RELEASED && button->lastValue == PRESSED) {
          // button released and pressed within debounce
          emitFormattedMessage(eventMsg, EVENT_STRING[button_release], button);
          emitFormattedMessage(eventMsg, EVENT_STRING[button_press], button);
          button->state = STATE_CLICKED_PRESSED;
          setConditionNS(&button->lastTime, &button->conditionTime, PRESSED_NS);
          lockTimeout = TIMEOUT_TRUE;
        }
        else {
          // unknown, reset state
          button->state = STATE_IDLE;
        }
        break;

        case STATE_CLICKED:
        if (button->lastValue == PRESSED) {
          // after clicked button pressed and held
          button->state = STATE_CLICKED_PRESSED;
          emitFormattedMessage(eventMsg, EVENT_STRING[button_press], button);
          setConditionNS(&button->lastTime, &button->conditionTime, PRESSED_NS);
          lockTimeout = TIMEOUT_TRUE;
        }
        else if (button->value == PRESSED && button->lastValue == RELEASED) {
          // after clicked button pressed and released within debounce
          emitFormattedMessage(eventMsg, EVENT_STRING[button_press], button);
          emitFormattedMessage(eventMsg, EVENT_STRING[button_release], button);
          button->state = STATE_DOUBLE_CLICKED;
          setConditionNS(&button->lastTime, &button->conditionTime, CLICKED_NS);
          lockTimeout = TIMEOUT_TRUE;
        }
        else {
          // unknown, reset state
          button->state = STATE_IDLE;
        }
        break;

        case STATE_CLICKED_PRESSED:
        if (button->lastValue == RELEASED) {
          emitFormattedMessage(eventMsg, EVENT_STRING[button_release], button);
          button->state = STATE_DOUBLE_CLICKED;
          emitState(eventMsg, button);
          button->state = STATE_IDLE;
        }
        else {
          emitState(eventMsg, button);
          button->state = STATE_RELEASE_WAIT;
        }
        break;

        case STATE_DOUBLE_CLICKED:
        case STATE_RELEASE_WAIT:
        emitState(eventMsg, button);
        button->state = STATE_IDLE;
        break;
      }
    }
    else {
      // emit state and transition state
      emitState(eventMsg, button);
      switch(button->state) {
        case STATE_PRESSED:
        case STATE_CLICKED_PRESSED:
        button->state = STATE_RELEASE_WAIT;
        break;

        default:
        button->state = STATE_IDLE;
        break;
      }
    }

    // if child has lock then perform handshake with parent
    if (!lockStatus) {
      pthread_mutex_unlock(&button->lockControl); // release for synchronization
      pthread_barrier_wait(&button->barrierControl); // begin synchronization
      pthread_barrier_wait(&button->barrierControl); // wait for synchronized
    }
  }
}



void * socketServer(void * args) {
  int * clients;
  clients = (int *)args;
  int l, fd, socket = openSocket();

  while (1) {
    // wait for connection
    if ( (fd = accept(socket, NULL, NULL)) == -1) {
      fprintf(stderr, "Error accepting incoming connection.\n");
      continue;
    }

    for(l = 0; l < MAX_CLIENTS; l++) {
      if (clients[l] == -1) {
        clients[l] = fd;
        break;
      }
    }

    if (l == MAX_CLIENTS) {
      send(fd, ERROR_MAX_CLIENTS, strlen(ERROR_MAX_CLIENTS), MSG_NOSIGNAL);
    }
    else {
    // add connection to empty slot
printf("Connect %d\n", fd);
    }
  }
}


// emit event for the current button state
void emitState(char * buffer, buttonDefinition * button) {
  switch (button->state) {
    case STATE_PRESSED:
    // emit event and transition to release wait
    emitFormattedMessage(buffer, EVENT_STRING[pressed], button);
    break;

    case STATE_CLICKED:
    // emit event and transition to idle
    emitFormattedMessage(buffer, EVENT_STRING[clicked], button);
    break;

    case STATE_CLICKED_PRESSED:
    // emit event and transition to release wait
    emitFormattedMessage(buffer, EVENT_STRING[clicked_pressed], button);
    break;

    case STATE_DOUBLE_CLICKED:
    // emit event and transition to idle
    emitFormattedMessage(buffer, EVENT_STRING[double_clicked], button);
    break;

    case STATE_RELEASE_WAIT:
    // emit event and transition to idle
    emitFormattedMessage(buffer, EVENT_STRING[released], button);
    break;
  }
}


void emitFormattedMessage(char * buffer, const char * eventString, buttonDefinition * button) {
  if (strlen(EVENT_MSG_FORMAT) + strlen(eventString) + strlen(button->gpio) >= EVENT_MSG_MAX_LENGTH) {
    fprintf(stderr, "Emit message too large for buffer.");
  }
  else {
    sprintf(buffer, EVENT_MSG_FORMAT, eventString, button->gpio, button->lastTime.tv_sec, button->lastTime.tv_nsec);
    emitMessage(buffer, button->clients);
  }
}


void emitMessage(const char * msg, int * clients) {
  int l, wl;
  for(l = 0; l < MAX_CLIENTS; l++) {
    if (clients[l] != -1) {
      wl = send(clients[l], msg, strlen(msg), MSG_NOSIGNAL);
      if (wl == -1) {
        // failure, remove client
        close(clients[l]);
        clients[l] = -1;
      }
    }
  }
}


int openSocket() {
  struct sockaddr_un addr;
  int fd;

  if ( (fd = socket(AF_UNIX, SOCK_STREAM, 0)) == -1) {
    fprintf(stderr, "Error opening event socket.");
    exit(-1);
  }

  memset(&addr, 0, sizeof(addr));
  addr.sun_family = AF_UNIX;
  strncpy(addr.sun_path, EVENT_SOCKET_PATH, sizeof(addr.sun_path)-1);
  unlink(EVENT_SOCKET_PATH);

  if (bind(fd, (struct sockaddr*)&addr, sizeof(addr)) == -1) {
    fprintf(stderr, "Event socket bind error.");
    exit(-1);
  }

  if (listen(fd, 5) == -1) {
    fprintf(stderr, "Event socket listen error.");
    exit(-1);
  }

  return fd;
}


void setConditionNS(struct timespec * currentTime, struct timespec * targetTime, uint32_t ns) {
  targetTime->tv_sec = currentTime->tv_sec;
  targetTime->tv_nsec = currentTime->tv_nsec;
  if (1000000000 - targetTime->tv_nsec < ns) {
    targetTime->tv_sec += 1;
    targetTime->tv_nsec = ns - (targetTime->tv_nsec - 1000000000);
  }
  else {
    targetTime->tv_nsec = targetTime->tv_nsec + ns;
  }
}
