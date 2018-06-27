IDIR =.
CC=gcc
CFLAGS=-m32 -I$(IDIR)

ODIR=.
LDIR =.

LIBS=-static -leb -static -lz 

_DEPS = eplkup_data.h base64.h  eplkup_font.h eplkup_gaiji.h eplkup_hook_handler.h eplkup_utils.h
DEPS = $(patsubst %,$(IDIR)/%,$(_DEPS))

_OBJ = eplkup_data.o base64.o eplkup.o  eplkup_font.o eplkup_gaiji.o eplkup_hook_handler.o eplkup_utils.o gaiji_table_chujiten.o gaiji_table_daijirin.o gaiji_table_daijisen.o gaiji_table_genius.o gaiji_table_kojien.o gaiji_table_meikyojj.o gaiji_table_meikyou.o gaiji_table_snmkg99.o gaiji_table_wadai5.o
OBJ = $(patsubst %,$(ODIR)/%,$(_OBJ))


$(ODIR)/%.o: %.c $(DEPS)
	$(CC) -c -o $@ $< $(CFLAGS)

eplkup: $(OBJ)
	$(CC) -o $@ $^ $(CFLAGS) $(LIBS)

.PHONY: clean

clean:
	rm -f $(ODIR)/*.o *~ core $(INCDIR)/*~ 
