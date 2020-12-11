define({ "api": [
  {
    "type": "get",
    "url": "/repoFiles/createCorpus/:projectId?api_key=your_API_key",
    "title": "Create EMU corpus",
    "description": "<p>It initializes the process of creating the corpus in EMU-SDMS format. It might take some longer time until it will finish working. It creates a ZIP bundle with only those files for which VAD, DIA, REC and SEG were run. So all the layers of anotation have to be defined. After finish, you can download the results by using &quot;Download Corpus&quot; API endpoint.</p>",
    "name": "CreateCorpus",
    "group": "Files",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "projectId",
            "description": "<p>The project ID for which you want to create the corpus. You can find it in UI</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "api_key",
            "description": "<p>Your API key</p>"
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
            "description": "<p>that the corpus has been created and you can download it</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": 'Korpus has been created! you can download it',\n}",
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
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/repoPanel.js",
    "groupTitle": "Files"
  },
  {
    "type": "delete",
    "url": "/repoFiles/delete/:containerId?api_key=your_API_key",
    "title": "Delete container",
    "description": "<p>Removes everthing related to uploaded file: the audio files themselves, the output from the tools and data from database</p>",
    "name": "DELETEcontainer",
    "group": "Files",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>The container ID which you want to delete</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "api_key",
            "description": "<p>Your API key</p>"
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
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>which was deleted</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "sessionId",
            "description": "<p>the id of the session to which the container belonged to</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": 'The container has been removed!',\n  \"sessionId\": \"5f58a92dfa006c8aed96f846\",\n  \"containerId\": \"5f58a92dfa006c8aed96f846\",\n}",
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
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/repoPanel.js",
    "groupTitle": "Files"
  },
  {
    "type": "get",
    "url": "/repoFiles/downloadCorpus/:projectId?api_key=your_API_key",
    "title": "Download EMU corpus",
    "description": "<p>After when you create the corpus you can download it.</p>",
    "name": "DownloadCorpus",
    "group": "Files",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "projectId",
            "description": "<p>The project ID for which you want to create the corpus. You can find it in UI</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "api_key",
            "description": "<p>Your API key</p>"
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
            "field": "you",
            "description": "<p>can save the ZIP file in EMU-SDMS corpus</p>"
          }
        ]
      }
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
        ]
      }
    },
    "version": "0.0.0",
    "filename": "controllers/repoPanel.js",
    "groupTitle": "Files"
  },
  {
    "type": "GET",
    "url": "/repoFiles/download/:containerId/:fileType?api_key=your_API_key",
    "title": "Download outputs",
    "description": "<p>If the task has been finised his job, you can download its result in choosen file format. Besides you can also download the oryginal file that you have sent to server and also the file that has been converted into 16000 Hz and 8bits. The conversion was neccessary to do in order to run speech services.</p>",
    "name": "GETOutputFile",
    "group": "Files",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>The container ID for which you want to download the results.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "fileType",
            "description": "<p>you have to indicate one of the following flag to indicate which kind of output you are interested in: <h3>Audio File related</h3><ul><li>&quot;oryginalAudio&quot;: you can download the same file which was sent.</li><li>&quot;audio&quot; : download the audio converted into PCM 16000Hz and 8bits</li></ul><h3>Voice Activity Detection (VAD) related</h3><ul><li>&quot;VADctm&quot;: downloads the output of VAD in CTM format</li><li>&quot;VADtextGrid&quot;: downloads the output of VAD in TextGrid format</li><li>&quot;VADJSON&quot;: downloads the output of VAD in JSON format</li></ul><h3>Diarization related</h3><ul><li>&quot;DIActm&quot;: downloads the output of diarization in CTM format.</li><li>&quot;DIAtextGrid&quot;: downloads the output of diarization in TextGrid format.</li><li>&quot;DIAJSON&quot;: downloads the outpu of the dirization in JSON format.</li></ul><h3>Speech Recognition related</h3><ul><li>&quot;JSONTranscript&quot;: downloads the transcription in JSON format</li><li>&quot;TXTTranscript&quot;: downloads the transcription in TXT file format.</li></ul><h3>Segmentation related</h3><ul><li>&quot;SEGctm&quot;: downloads the output of Segmentation in CTM format</li><li>&quot;SEGtextGrid&quot;: downloads the output of Segmentation in TextGrid format.</li><li>&quot;EMUJSON&quot;: downloads the outpu of Segmentation in EMU-SDMS format.</li></ul></p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "api_key",
            "description": "<p>Your API key</p>"
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
            "field": "returns",
            "description": "<p>audio file or file with the output to download</p>"
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
            "description": "<p>When the resource could not be found</p>"
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
    "groupTitle": "Files"
  },
  {
    "type": "put",
    "url": "/repoFiles/runSpeechDiarization/:containerId?api_key=your_API_key",
    "title": "Diaryzacja",
    "description": "<p>Narzędzie diaryzacji. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze o danym ID. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia korzystając z osobnego zapytania API.</p>",
    "name": "DIATool",
    "group": "Tools",
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
            "field": "api_key",
            "description": "<p>Token uzyskany po zalogowaniu</p>"
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
    "groupTitle": "Tools"
  },
  {
    "type": "put",
    "url": "/runSpeechRecognition/:containerId?api_key=your_API_key",
    "title": "Rozpoznawanie mowy",
    "description": "<p>Narzędzie rozpoznaje automatycznie mowę z wgranego pliku. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze o danym ID. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia korzystając z osobnego zapytania API.</p>",
    "name": "RECTool",
    "group": "Tools",
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
            "field": "api_key",
            "description": "<p>Token uzyskany po zalogowaniu</p>"
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
    "groupTitle": "Tools"
  },
  {
    "type": "put",
    "url": "/runSpeechSegmentation/:containerId?api_key=your_API_key",
    "title": "Segmentacja",
    "description": "<p>Narzędzie segmentacji. Dla krótkich nagrań (poniżej 0.5MB) uruchamiany jest algorytm forcealign. Dla dłuższych plików segmentalign. Usługa wymaga uruchomienia najpierw usługi rozpoznawania. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze o danym ID. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia korzystając z osobnego zapytania API.</p>",
    "name": "SEGTool",
    "group": "Tools",
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
            "field": "api_key",
            "description": "<p>Token uzyskany po zalogowaniu</p>"
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
    "groupTitle": "Tools"
  },
  {
    "type": "put",
    "url": "/repoFiles/runSpeechVAD/:containerId?api_key=your_API_key",
    "title": "Detekcja mowy",
    "description": "<p>Narzędzie detekcji mowy. Po wykonaniu zapytania należy poczekać na zakończenie pracy. Po zakończeniu serwer zapisze rezultaty w kontenerze o danym ID. Aby ściągnąć rezultaty działania narzędzia należy skorzystać z osobnego zapytania API. W międzyczasie możesz odpytywać serwer na temat statusu wykonania tego narzędzia korzystając z osobnego zapytania API.</p>",
    "name": "VADTool",
    "group": "Tools",
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
            "field": "api_key",
            "description": "<p>Token uzyskany po zalogowaniu</p>"
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
    "groupTitle": "Tools"
  },
  {
    "type": "post",
    "url": "/auth/forgotPass/:emailAddress",
    "title": "Odzyskanie hasła",
    "description": "<p>Pozwala użytkownikowi wygenerować nowe hasło. Wywołanie tego api powoduje wysłąnie wiadomości email na adres użytkownika z linkiem do strony gdzie użytkownik może wprowadzić nowe hasło.</p>",
    "name": "ForgotPassword",
    "group": "User",
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
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/auth/login",
    "title": "Logowanie",
    "description": "<p>Pozwala na zalogowanie się już zarejestrowanym użytkownikom i uzyskanie tokenu do przeprowadzania dzalszych zapytań</p>",
    "name": "LoginUser",
    "group": "User",
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
            "description": "<p>Token który należy używać w polu api_key podczas wykonywania operacji na plikach. Token jest ważny przez 192h (8 dni). Po tym czasie należy zalogować się ponownie.</p>"
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
    "groupTitle": "User"
  },
  {
    "type": "put",
    "url": "/auth/registration",
    "title": "Rejestracja użytkownika",
    "description": "<p>Rejestracja nowego użytkownika. Jest ona konieczna aby uzyskać po zalogowaniu specjalny token na potrzeby uruchamiania narzędzi mowy. Dzięki temu masz pewność że Twoje dane i rezultaty ich przetwarzania są bezpieczne!</p>",
    "name": "RegisterUser",
    "group": "User",
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
    "groupTitle": "User"
  }
] });
