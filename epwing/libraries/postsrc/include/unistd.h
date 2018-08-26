#ifdef __APPLE__
    #include <sys/uio.h>
#else
    #ifdef WIN32
        #include <io.h>
    #else
        #include <sys/io.h>
    #endif
#endif
