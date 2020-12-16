define({ "api": [
  {
    "type": "put",
    "url": "/repoFiles/runSpeechDiarization/:containerId",
    "title": "Diaryzacja",
    "description": "<p>Narzędzie diaryzacji. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze o danym ID. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia wykorzystując containerId w osobnym zapytaniu API.</p>",
    "name": "DIATool",
    "group": "Narzędzia",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>Identyfikator zasobu. Możesz go również znaleźć w graficznym interfejsie użytkownika</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>informacja o zakończeniu działania</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>Identyfikator zasobu</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "toolType",
            "description": "<p>zwraca flagę &quot;DIA&quot;</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "DIAsegments",
            "description": "<p>zwraca segmenty diaryzacji w postaci JSON. Aby pobrać wynik w innym formacie (CTM lub TextGrid) należy skorzystać z osobnego zapytania API.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": 'Diaryzacja zakończona sukcesem!',\n  \"containerId\": \"5f58a92dfa006c8aed96f846\",\n  \"toolType\": \"DIA\",\n  \"VADSegments\": [\n                     {\n                         \"startTime\":0.68,\n                         \"endTime\":2.74,\n                         \"editable\":true,\n                         \"color\":\"#394b55\",\n                         \"labelText\":\"1\"\n                     },\n                     {\n                         \"startTime\":2.74,\n                         \"endTime\":4.62,\n                         \"editable\":true,\n                         \"color\":\"#394b55\",\n                         \"labelText\":\"2\"\n                     },\n                  ]\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": ""
          }
        ],
        "503": [
          {
            "group": "503",
            "optional": false,
            "field": "ServiceUnavailable",
            "description": "<p>Gdy coś pójdzie nie tak z usługą</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/repoPanel.js",
    "groupTitle": "Narzędzia"
  },
  {
    "type": "put",
    "url": "/runSpeechRecognition/:containerId",
    "title": "Rozpoznawanie mowy",
    "description": "<p>Narzędzie rozpoznaje automatycznie mowę z wgranego pliku. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze o danym ID. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia korzystając z osobnego zapytania API.</p>",
    "name": "RECTool",
    "group": "Narzędzia",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>Identyfikator zasobu. Możesz go również znaleźć w graficznym interfejsie użytkownika</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>that this tool finished working</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>Identyfikator kontenera</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "toolType",
            "description": "<p>zawiera flage &quot;REC&quot;</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": 'Rozpoznawanie mowy zostało zakończone!',\n  \"containerId\": \"5f58a92dfa006c8aed96f846\",\n  \"toolType\": \"REC\",\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "Serwer",
            "description": "<p>error</p>"
          }
        ],
        "503": [
          {
            "group": "503",
            "optional": false,
            "field": "Service",
            "description": "<p>Unavailable Gdy coś pójdzie nie tak z usługą rozpoznawania</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/repoPanel.js",
    "groupTitle": "Narzędzia"
  },
  {
    "type": "put",
    "url": "/runSpeechSegmentation/:containerId",
    "title": "Segmentacja",
    "description": "<p>Narzędzie segmentacji. Dla krótkich nagrań (poniżej 0.5MB) uruchamiany jest algorytm forcealign. Dla dłuższych plików segmentalign. Usługa wymaga uruchomienia najpierw usługi rozpoznawania. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze o danym ID. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia korzystając z osobnego zapytania API.</p>",
    "name": "SEGTool",
    "group": "Narzędzia",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>Identyfikator zasobu. Możesz go również znaleźć w graficznym interfejsie użytkownika</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>informacja o zakończeniu działania</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>Identyfikator kontenera</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "toolType",
            "description": "<p>zawiera flage &quot;REC&quot;</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "EMUlink",
            "description": "<p>zawiera link do podglądu segmentacji w aplikacji EMU</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": 'Segmentacja została wykonana pomyślnie',\n  \"containerId\": \"5f58a92dfa006c8aed96f846\",\n  \"toolType\": \"SEG\",\n  \"EMUlink\": \"https://ips-lmu.github.io/EMU-webApp/?audioGetUrl=TODO\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": ""
          }
        ],
        "503": [
          {
            "group": "503",
            "optional": false,
            "field": "ServiceUnavailable",
            "description": "<p>Gdy coś pójdzie nie tak z usługą segmentacji</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/repoPanel.js",
    "groupTitle": "Narzędzia"
  },
  {
    "type": "put",
    "url": "/repoFiles/runSpeechVAD/:containerId",
    "title": "Detekcja mowy",
    "description": "<p>Narzędzie detekcji mowy. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze o danym ID. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia korzystając z containerId w osobnym zapytaniu API.</p>",
    "name": "VADTool",
    "group": "Narzędzia",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>Identyfikator zasobu. Możesz go również znaleźć w graficznym interfejsie użytkownika</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>informacja o zakończeniu działania</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>Identyfikator zasobu</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "toolType",
            "description": "<p>zwraca flagę &quot;VAD&quot;</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "VADSegments",
            "description": "<p>zwraca segmenty detekcji w postaci JSON. Aby pobrać wynik w innym formacie (CTM lub TextGrid) należy skorzystać z osobnego zapytania API.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": 'Zakończono detekcję mowy!',\n  \"containerId\": \"5f58a92dfa006c8aed96f846\",\n  \"toolType\": \"VAD\",\n  \"VADSegments\": [\n                     {\n                         \"startTime\":0.68,\n                         \"endTime\":2.74,\n                         \"editable\":true,\n                         \"color\":\"#394b55\",\n                         \"labelText\":\"speech\"\n                     },\n                     {\n                         \"startTime\":2.74,\n                         \"endTime\":5.97,\n                         \"editable\":true,\n                         \"color\":\"#394b55\",\n                         \"labelText\":\"speech\"\n                     }\n                   ]\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": ""
          }
        ],
        "503": [
          {
            "group": "503",
            "optional": false,
            "field": "ServiceUnavailable",
            "description": "<p>Gdy coś pójdzie nie tak z usługą</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/repoPanel.js",
    "groupTitle": "Narzędzia"
  },
  {
    "type": "get",
    "url": "/repoFiles/createCorpus/:projectId",
    "title": "Tworzenie korpusu",
    "description": "<p>Wywołanie powoduje inicjalizację procesu tworzenia korpusu w formacie EMU-SDMS i zapisuje go na serwerze w postaci pliku ZIP. Korpus jest tworzony z plików dla których wykonane zostały wszystkie poziomy anotacji (VAD, DIA, REC oraz SEG). Proces może trać dłuższy czas w zależności od ilości plików w projekcie. Po zakończeniu możesz ściągnąć korpus za pomocą osobnego zapytania API. W trakcie jego tworzenia możesz również odpytać czy korpus dla danego projektu został zakończony.</p>",
    "name": "CreateCorpus",
    "group": "Pliki",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "projectId",
            "description": "<p>Identyfikator projektu dla którego tworzony jest korpus. Możesz go odnaleźć w interfejsie użytkownika bądź skorzystać z domyślnego projektu którego ID jest zwracane podczas rejestracji.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>wiadomość że korpus został utworzony i możesz go ściągnąć.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": 'Tworzenie korpusu zakończone sukcesem. Możesz go ściągnąć.',\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "204": [
          {
            "group": "204",
            "optional": false,
            "field": "NoContent",
            "description": "<p>Twoje pliki nie zawierają wszystkich poziomów anotacji lub coś poszło nie tak na serwerze</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/repoPanel.js",
    "groupTitle": "Pliki"
  },
  {
    "type": "delete",
    "url": "/repoFiles/delete/:containerId",
    "title": "Usuwanie kontenera",
    "description": "<p>Usuwa kontener oraz wszystko co z nim związane (pliki, anotacje, wpisy w bazie danych).</p>",
    "name": "DELETEcontainer",
    "group": "Pliki",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>Identyfikator kontenera który chcesz usunąć</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Kontener został usunięty!</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>ID kontenera który został usunięty</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "sessionId",
            "description": "<p>ID sesji do której należy kontener</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": 'Kontener został usunięty!',\n  \"sessionId\": \"5f58a92dfa006c8aed96f846\",\n  \"containerId\": \"5f58a92dfa006c8aed96f846\",\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "404": [
          {
            "group": "404",
            "optional": false,
            "field": "NotFound",
            "description": "<p>Nie znaleziono kontenera o danym ID</p>"
          }
        ],
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": ""
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/repoPanel.js",
    "groupTitle": "Pliki"
  },
  {
    "type": "get",
    "url": "/repoFiles/downloadCorpus/:projectId",
    "title": "Pobierz korpus EMU",
    "description": "<p>After when you create the corpus you can download it.</p>",
    "name": "DownloadCorpus",
    "group": "Pliki",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "projectId",
            "description": "<p>Identyfikator projektu dla którego chcesz pobrać korpus. Znajdziesz go również w interfejsie użytkownika.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "korpus",
            "description": "<p>w formacie ZIP</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "404": [
          {
            "group": "404",
            "optional": false,
            "field": "NotFound",
            "description": "<p>nie znaleziono projektu o danym ID</p>"
          }
        ],
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": ""
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/repoPanel.js",
    "groupTitle": "Pliki"
  },
  {
    "type": "GET",
    "url": "/repoFiles/download/:containerId/:fileType",
    "title": "Pobierz wyniki",
    "description": "<p>Za pomocą tego zapytania możesz pobrać efekty pracy narzędzi automatycznych. Oprócz tego możesz pobrać oryginalnie wgrany plik oraz plik przekonwertowany do formatu PCM 16000Hz 16bits.</p>",
    "name": "GETOutputFile",
    "group": "Pliki",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>Identyfikator kontenera dla którego chcesz pobrać wynik. Możesz go również znaleźć w interfejsie użytkownika</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "fileType",
            "description": "<p>Wskazanie formatu w jakim chcesz pobrać wynik. <h3>Pliki audio</h3><ul><li>&quot;oryginalAudio&quot;: Pobranie pliku który został wysłany na serwer.</li><li>&quot;audio&quot; : pobranie pliku przekonwertowanego do PCM 16000Hz 8bits</li></ul><h3>Detekcja mowy (VAD) </h3><ul><li>&quot;VADctm&quot;: Wynik działania VAD w formacie CTM</li><li>&quot;VADtextGrid&quot;: Wynik działania VAD w formacie TextGrid</li><li>&quot;VADJSON&quot;: Wynik działania VAD w formacie JSON</li></ul><h3>Diaryzacja (DIA)</h3><ul><li>&quot;DIActm&quot;: Wynik działania DIA w formacie CTM</li><li>&quot;DIAtextGrid&quot;: Wynik działania DIA w formacie TextGrid.</li><li>&quot;DIAJSON&quot;: Wynik działania DIA w formacie JSON.</li></ul><h3>Rozpoznawanie mowy (REC)</h3><ul><li>&quot;JSONTranscript&quot;: Wynik działania REC w formacie JSCON</li><li>&quot;TXTTranscript&quot;: Wynik działania REC w formacie TXT.</li></ul><h3>Segmentacja (SEG)</h3><ul><li>&quot;SEGctm&quot;: Wynik działania SEG w formacie CTM</li><li>&quot;SEGtextGrid&quot;: Wynik działania SEG w formacie TextGrid.</li><li>&quot;EMUJSON&quot;: Wynik działania SEG w formacie EMU-SDMS.</li></ul></p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Ciąg znaków 'Bearer token' gdzie w miejsce 'token' należy wstawić token uzyskany podczas logowania.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "zwraca",
            "description": "<p>dany żądany plik</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK input 1 0.120 7.610 speech",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "404": [
          {
            "group": "404",
            "optional": false,
            "field": "NotFound",
            "description": "<p>Nie znaleziono kontenera o danym ID</p>"
          }
        ],
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": "<p>Coś poszło nie tak na serwerze</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/repoPanel.js",
    "groupTitle": "Pliki"
  },
  {
    "type": "post",
    "url": "/auth/forgotPass/:emailAddress",
    "title": "Odzyskanie hasła",
    "description": "<p>Pozwala użytkownikowi wygenerować nowe hasło. Wywołanie tego api powoduje wysłąnie wiadomości email na adres użytkownika z linkiem do strony gdzie użytkownik może wprowadzić nowe hasło.</p>",
    "name": "ForgotPassword",
    "group": "Użytkownik",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Email</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Wiadomość potwierdzająca wysłanie maila</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": \"Wiadomość z dalszymi instrukcjami została wysłana na podany adres email\",\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "401": [
          {
            "group": "401",
            "optional": false,
            "field": "Unathorized",
            "description": "<p>Nie znaleziono danego adres email</p>"
          }
        ],
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": "<p>Serwer error</p>"
          }
        ],
        "502": [
          {
            "group": "502",
            "optional": false,
            "field": "BadGateway",
            "description": "<p>Problem z wysłaniem maila</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/auth.js",
    "groupTitle": "Użytkownik"
  },
  {
    "type": "post",
    "url": "/auth/login",
    "title": "Logowanie",
    "description": "<p>Pozwala na zalogowanie się już zarejestrowanym użytkownikom i uzyskanie tokenu JWT do przeprowadzania dzalszych zapytań</p>",
    "name": "LoginUser",
    "group": "Użytkownik",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Email użytkownika</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>Hasło użytkownika</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Token który należy podać w nagłówku zapytania do API w polu &quot;Authorization&quot; jako 'Bearer <token>'. Token jest ważny przez 192h (8 dni). Po tym czasie należy zalogować się ponownie.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>Identyfikator użytkownika</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "userName",
            "description": "<p>Nazwa użytkownika</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "firstProjectId",
            "description": "<p>Identyfikator pierwszego stworzonego projektu do którego domyślnie będą wgrywane pliki oraz rezultaty działania narzędzi (o ile nie stworzysz osobnego projektu)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"token\": eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1rbGVjQHBqd3N0ay5lZHUucGwiLCJ1c2VySWQiOiI1ZjU4YTkyZGZhMDA2YzhhZWQ5NmY4NDYiLCJpYXQiOjE2MDYzMDc1NzEsImV9cXI6MPYwNjY1MzEeMX0.-ABd2a0F3lcuI0yDV7eymq4ey5_J__xGdyYAk56icO4,\n  \"userId\": \"5f58a92dfa006c8aed96f846\",\n  \"userName\": Kowalski,\n  \"firstProjectId\": \"5fd33950667fa7255da2dfa9\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "401": [
          {
            "group": "401",
            "optional": false,
            "field": "Unathorized",
            "description": "<p>Błędne hasło</p>"
          }
        ],
        "404": [
          {
            "group": "404",
            "optional": false,
            "field": "Not",
            "description": "<p>Found Użytkownik o podanym email nie został znaleziony</p>"
          }
        ],
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": "<p>Serwer error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/auth.js",
    "groupTitle": "Użytkownik"
  },
  {
    "type": "put",
    "url": "/auth/registration",
    "title": "Rejestracja użytkownika",
    "description": "<p>Rejestracja nowego użytkownika. Po zalogowaniu uzyskasz token na potrzeby uruchamiania narzędzi mowy z uwzględnieniem bezpieczeństwa Twoich danych.</p>",
    "name": "RegisterUser",
    "group": "Użytkownik",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Email</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Imię</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>Hasło</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>wiadomość potwierdzająca</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>Identyfikator użytkownika</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "firstProjectId",
            "description": "<p>Identyfikator pierwszego stworzonego projektu do którego domyślnie będą wgrywane pliki oraz rezultaty działania narzędzi (o ile nie stworzysz osobnego projektu).</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 201 CREATED\n{\n  \"message\": 'Użytkownik został stworzony',\n  \"userId\": \"5f58a92dfa006c8aed96f846\",\n  \"firstProjectId\": \"5fd33950667fa7255da2dfa9\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "422": [
          {
            "group": "422",
            "optional": false,
            "field": "UnprocesssableEntity",
            "description": "<p>Błędy walidacji</p>"
          }
        ],
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": "<p>Serwer error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/auth.js",
    "groupTitle": "Użytkownik"
  }
] });
