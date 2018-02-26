#define EVENT_SOCKET_PATH "./buttonevents"
#define MAX_BUTTONS 10
#define MAX_CLIENTS 2
#define ERROR_MAX_CLIENTS "error {\"error\": \"Maximum client connections exceeded.\"}"

enum ButtonState {
  STATE_INIT,
  STATE_IDLE,
  STATE_PRESSED,
  STATE_CLICKED,
  STATE_CLICKED_PRESSED,
  STATE_DOUBLE_CLICKED,
  STATE_RELEASE_WAIT
};

enum DebounceState {
  INACTIVE,
  ACTIVE
};

enum LockTimeoutState {
  TIMEOUT_FALSE,
  TIMEOUT_TRUE
};

enum ButtonValue {
  PRESSED = 48,
  RELEASED
};

// I.E. 'button_changed {"gpio": "17", "time": 012345678900123456789}'
#define EVENT_MSG_MAX_LENGTH 128
static const char * EVENT_MSG_FORMAT = "%s {\"gpio\": \"%s\", \"time\": {\"tv_sec\": %ld, \"tv_nsec\": %ld}}\n";

// define events
#define FOREACH_EVENT(EVENT) \
        EVENT(button_changed)   \
        EVENT(button_press)  \
        EVENT(button_release)   \
        EVENT(pressed)  \
        EVENT(clicked)  \
        EVENT(clicked_pressed)  \
        EVENT(double_clicked)  \
        EVENT(released)  \

#define GENERATE_ENUM(ENUM) ENUM,
#define GENERATE_STRING(STRING) #STRING,

enum EVENT_ENUM {
    FOREACH_EVENT(GENERATE_ENUM)
};

static const char *EVENT_STRING[] = {
    FOREACH_EVENT(GENERATE_STRING)
};


#define SEC_NSEC 1000000000
#define DEBOUNCE_MS 30
#define DEBOUNCE_NS 20000000
#define PRESSED_MS 200
#define PRESSED_NS 200000000
#define CLICKED_MS 200
#define CLICKED_NS 200000000

typedef struct {
  pthread_mutex_t lockControl;
  pthread_barrier_t barrierControl;
  struct timespec lastTime;
  struct timespec conditionTime;
  const char * gpio;
  int fd; // file descriptor for button input
  enum ButtonState state;
  int debounceState;
  uint8_t value;
  uint8_t lastValue;
  int * clients;
  pthread_t parent;
  pthread_t child;
  long debounce_ns;
} buttonDefinition;

typedef struct {
  char ** gpios;
  int gpioCount;
  int * clients;
} pollerThreadArgs;

typedef struct {
  int index;
  int fd; // file descriptor for button input
  enum ButtonState state;
  int debouncing;
  uint8_t value;
  uint8_t lastValue;
  int * clients;
} gpioButton;

void * buttonPoller(void * args);
void * buttonDebounce(void * args);
void * socketServer(void * args);
int openSocket();
void emitMessage(const char * msg, int * clients);
void * buttonParent(void * args);
void * buttonChild(void * args);
void emitState(char * buffer, buttonDefinition * button);
void emitFormattedMessage(char * buffer, const char * eventString, buttonDefinition * button);
void setConditionNS(struct timespec * currentTime, struct timespec * targetTime, uint32_t ns);
