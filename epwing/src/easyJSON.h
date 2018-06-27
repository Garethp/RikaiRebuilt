//
// Created by Gareth on 6/27/2018.
//

#include "cJSON.h"

#ifndef EPLKUP_EASYJSON_H
#define EPLKUP_EASYJSON_H

typedef struct easyJSON easyJSON;
struct easyJSON
{
    cJSON *object;

    easyJSON (*AddString)(easyJSON self, const char *name, const char *string);
    char * (*ToString)(struct easyJSON self);
};

easyJSON easyJSON_AddString(easyJSON self, const char *name, const char *string);
char * easyJSON_ToString(easyJSON self);

easyJSON easyJSON_create();
#endif //EPLKUP_EASYJSON_H
