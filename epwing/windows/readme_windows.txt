Date:        5/2/2015
Compiled By: Christopher Brochtrup
Version:     eplkup v1.5
Compiler:    Visual Studio 2008
Notes:       Executable is 32-bit.

How to compile:
---------------

1) Download eb-4.2.2-win32.zip from ftp://ftp.sra.co.jp/pub/misc/eb/
   to get the Visual Studio project file.

2) Download eb-4.4.3.tar.bz2 from ftp://ftp.sra.co.jp/pub/misc/eb/
   to get the latest EB Library source code and add it to the eb Visual Studio project.

3) Download zlib 1.2.1 source code from http://gnuwin32.sourceforge.net/packages/zlib.htm
   and add it to the eb Visual Studio project.

4) Compile the eb Visual Studio project.
   Output is eb.lib and eb.dll.

5) Create a new Visual Studio project for eplkup.

6) Add the .c/.h files for eplkup to the eplkup Visual Studio project.

7) Add eb.lib (created in Step 4) to the eplkup Visual Studio project.

8) Download libiconv from http://gnuwin32.sourceforge.net/packages/libiconv.htm
   and add libiconv.lib to the eplkup Visual Studio project.

9) Compile the eplkup Visual Studio project.
   Output is: eplkup.exe
