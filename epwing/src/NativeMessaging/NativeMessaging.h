//
// Created by Gareth on 6/28/2018.
//

#ifndef EPLKUP_NATIVEMESSAGING_H
#define EPLKUP_NATIVEMESSAGING_H

#include "../easyJSON.h"

typedef struct NativeMessaging NativeMessaging;
struct NativeMessaging
{
    int fileNo;

    char* (*Read)(int fileNo);
    easyJSON (*ReadJSON)(int fileNo);
    void (*Write)(char *message);
    void (*WriteJSON)(easyJSON json);
    void (*WriteError)(char* error);
};


int NativeMessaging_Unpack(unsigned char packed[4]);
char *NativeMessaging_Pack(int number);

char* NativeMessaging_Read(int fileNo);
easyJSON NativeMessaging_ReadJSON(int fileNo);
void NativeMessaging_Write(char *message);
void NativeMessaging_WriteJSON(easyJSON json);
void NativeMessaging_WriteError(char* error);
NativeMessaging newNativeMessaging();

#endif //EPLKUP_NATIVEMESSAGING_H
