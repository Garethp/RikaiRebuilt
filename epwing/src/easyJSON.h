//
// Created by Gareth on 6/27/2018.
//

#include "cJSON.h"
#include "stdbool.h"

#ifndef EPLKUP_EASYJSON_H
#define EPLKUP_EASYJSON_H

typedef struct easyJSON easyJSON;
struct easyJSON
{
    cJSON *object;

    easyJSON (*AddString)(easyJSON self, const char *name, const char *string);
    char *(*ToString)(struct easyJSON self);
    bool (*Has)(easyJSON self, char *property);

    easyJSON (*Get)(easyJSON self, char *property);
    char *(*GetString)(struct easyJSON self, char *property);
    int (*GetInt)(easyJSON self, char* property);

    bool (*IsString)(easyJSON self, char *property);
    bool (*IsTrue)(easyJSON self, char *property);
    bool (*IsInt)(easyJSON self, char *property);
};

easyJSON easyJSON_AddString(easyJSON self, const char *name, const char *string);
char * easyJSON_ToString(easyJSON self);

easyJSON easyJSON_Get(easyJSON self, char* property);
char * easyJSON_GetString(struct easyJSON self, char * property);
int easyJSON_GetInt(easyJSON self, char* property);

bool easyJSON_Has(easyJSON self, char* property);

bool easyJSON_IsString(easyJSON self, char* property);
bool easyJSON_IsTrue(easyJSON self, char* property);
bool easyJSON_IsInt(easyJSON self, char* property);

easyJSON easyJSON_create();
easyJSON easyJSON_FromString(char *message);
easyJSON easyJSON_FromObject(cJSON *object);
#endif //EPLKUP_EASYJSON_H
