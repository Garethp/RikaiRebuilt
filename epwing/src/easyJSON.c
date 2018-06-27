#include "cJSON.h"
#include "easyJSON.h"

easyJSON easyJSON_AddString(easyJSON self, const char *name, const char *string) {
//    cJSON *jsonString = cJSON_CreateString(string);
    cJSON_AddStringToObject(self.object, name, string);

    return self;
}

char *easyJSON_ToString(easyJSON self) {
    return cJSON_Print(self.object);
}

easyJSON easyJSON_create() {
    easyJSON json;
    json.object = cJSON_CreateObject();

    json.AddString = easyJSON_AddString;
    json.ToString = easyJSON_ToString;
    return json;
}


