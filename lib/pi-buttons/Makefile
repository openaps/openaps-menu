LIBS=-lpthread -lrt

buttons: buttons.o
	$(CC) -o $@ $^ $(CFLAGS) $(LIBS)

.PHONY: clean

clean:
	rm -vf *.o buttons
