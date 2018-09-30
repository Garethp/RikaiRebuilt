//
// Created by Gareth on 6/28/2018.
//

#include "NativeMessaging.h"
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>


char *NativeMessaging_Read(int fileNo) {
    // Get the message Length
    unsigned char packedLength[4];
    read(fileno(stdin), &packedLength, 4);

    int messageLength = NativeMessaging_Unpack(packedLength);

    //Create our char array
    char *message = malloc((size_t) (messageLength + 1));
    char characterBuffer;

    //Fill the message object
    for (int i = 0; i < messageLength; i++) {
        read(fileno(stdin), &characterBuffer, 1);

        message[i] = characterBuffer;
    }

    message[messageLength] = '\0';

    return message;
}
easyJSON NativeMessaging_ReadJSON(int fileNo) {
    return easyJSON_FromString(NativeMessaging_Read(fileNo));
}

void NativeMessaging_Write(char *message) {
    char *packedMessageLength = NativeMessaging_Pack(strlen(message));

    //Print the response length and then the response. Flush after printing
    printf("%c%c%c%c", packedMessageLength[0], packedMessageLength[1], packedMessageLength[2], packedMessageLength[3]);
    printf(message);

    fflush(stdout);
}

void NativeMessaging_WriteJSON(easyJSON json) {
    NativeMessaging_Write(json.ToString(json));
}

void NativeMessaging_WriteError(char *error) {
    easyJSON message = easyJSON_create();
    message.AddString(message, "error", error);

    NativeMessaging_WriteJSON(message);
}

int NativeMessaging_Unpack(unsigned char packed[4]) {
    return (int) (packed[3] << 24 |
                  packed[2] << 16 |
                  packed[1] << 8 |
                  packed[0]);
}

char *NativeMessaging_Pack(int number) {
    char packed[4] = {(char) ((number >> 0) & 0xFF),
            (char) ((number >> 8) & 0xFF),
            (char) ((number >> 16) & 0xFF),
            (char) ((number >> 24) & 0xFF)};

    return packed;
}

NativeMessaging newNativeMessaging() {
    NativeMessaging messaging;

    messaging.Read = NativeMessaging_Read;
    messaging.ReadJSON = NativeMessaging_ReadJSON;
    messaging.Write = NativeMessaging_Write;
    messaging.WriteJSON = NativeMessaging_WriteJSON;
    messaging.WriteError = NativeMessaging_WriteError;

    return messaging;
}
