#include "cJSON.h"
#include "easyJSON.h"

easyJSON easyJSON_AddString(easyJSON self, const char *name, const char *string) {
//    cJSON *jsonString = cJSON_CreateString(string);
    cJSON_AddStringToObject(self.object, name, string);

    return self;
}

char *easyJSON_ToString(easyJSON self) {
    if (cJSON_IsString(self.object)) {
        return self.object->valuestring;
    }

    return cJSON_PrintUnformatted(self.object);
}

bool easyJSON_Has(easyJSON self, char* property) {
    return cJSON_HasObjectItem(self.object, property);
}

easyJSON easyJSON_Get(easyJSON self, char* property) {
    return easyJSON_FromObject(cJSON_GetObjectItem(self.object, property));
}

char * easyJSON_GetString(struct easyJSON self, char* property) {
    easyJSON json = self.Get(self, property);
    return json.ToString(json);
}

int easyJSON_GetInt(easyJSON self, char* property) {
    easyJSON json = self.Get(self, property);
    return json.object->valueint;
}

bool easyJSON_IsString(easyJSON self, char* property) {
    if (!cJSON_IsObject(self.object)) {
        return false;
    }

    if (!self.Has(self, property)) {
        return false;
    }

    easyJSON json = self.Get(self, property);
    return cJSON_IsString(json.object);
}

bool easyJSON_IsTrue(easyJSON self, char* property) {
    if (!cJSON_IsObject(self.object)) {
        return false;
    }

    if (!self.Has(self, property)) {
        return false;
    }

    easyJSON json = self.Get(self, property);
    if (!cJSON_IsBool(json.object)) {
        return false;
    }

    return cJSON_IsTrue(json.object);
}

bool easyJSON_IsInt(easyJSON self, char* property) {
    if (!cJSON_IsObject(self.object)) {
        return false;
    }

    if (!self.Has(self, property)) {
        return false;
    }

    easyJSON json = self.Get(self, property);
    return cJSON_IsNumber(json.object);
}

easyJSON easyJSON_create() {
    easyJSON json;
    json.object = cJSON_CreateObject();

    json.AddString = easyJSON_AddString;
    json.ToString = easyJSON_ToString;
    json.Has = easyJSON_Has;

    json.Get = easyJSON_Get;
    json.GetString = easyJSON_GetString;
    json.GetInt = easyJSON_GetInt;

    json.IsString = easyJSON_IsString;
    json.IsTrue = easyJSON_IsTrue;
    json.IsInt = easyJSON_IsInt;

    return json;
}


easyJSON easyJSON_FromString(char *message) {
    easyJSON json = easyJSON_create();
    json.object = cJSON_Parse(message);

    return json;
}

easyJSON easyJSON_FromObject(cJSON *object) {
    easyJSON json = easyJSON_create();
    json.object = object;
    return json;
}
