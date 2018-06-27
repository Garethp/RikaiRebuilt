Date:        5/2/2015
Compiled By: Christopher Brochtrup
Version:     eplkup v1.5
Compiler:    gcc 4.8.2
Notes:       Executable is 32-bit. Compiled on Linux Mint 17 32-bit.
             Statically linked with zlib and eb.

How to compile:
---------------

* This assumes a fresh install of Linux Mint.

1) Use these commands to get needed development tools:
   sudo apt-get update
   sudo apt-get install build-essential
   sudo apt-get install zlib1g-dev
   sudo apt-get install libeb16-dev

2) Put all of eplkup .c/.h files into a folder called "eplkup".

3) Put "Makefile" in the "eplkup" folder.

4) Type this:
   make

   This will create an executable called "eplkup".
