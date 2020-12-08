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
    "title": "Run DIA tool",
    "description": "<p>Diarization (DIA) tool for recognizing speech parts within recordings and assigning the number to a particular speaker. By default, it returns the output in JSON format. However, if you want to download the output in different format, look at the &quot;Download outputs&quot; API endpoint.</p>",
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
            "description": "<p>The container ID for which you want to run the tool</p>"
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
            "description": "<p>that this tool finished working</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>the container ID which was used</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "toolType",
            "description": "<p>returns &quot;DIA&quot; string</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "DIAsegments",
            "description": "<p>returns Diarization segments in JSON format. If you wish to get output as a file in CTM or TextGrid format, see how to get output file</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": ''The service for this container has finished working with success!!',\n  \"containerId\": \"5f58a92dfa006c8aed96f846\",\n  \"toolType\": \"DIA\",\n  \"VADSegments\": [\n                     {\n                         \"startTime\":0.68,\n                         \"endTime\":2.74,\n                         \"editable\":true,\n                         \"color\":\"#394b55\",\n                         \"labelText\":\"1\"\n                     },\n                     {\n                         \"startTime\":2.74,\n                         \"endTime\":4.62,\n                         \"editable\":true,\n                         \"color\":\"#394b55\",\n                         \"labelText\":\"2\"\n                     },\n                  ]\n}",
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
            "field": "Service",
            "description": "<p>Unavailable When something goes wrong with the service</p>"
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
    "title": "Run SEG tool",
    "description": "<p>Recognition (REC) tool. In order to download the results of the recognition, you have to run separate API request. Please look at the &quot;Download outputs&quot; API endpoint.</p>",
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
            "description": "<p>The container ID for which you want to run the tool</p>"
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
            "description": "<p>that this tool finished working</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>the container ID which was used</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "toolType",
            "description": "<p>returns &quot;SEG&quot; string</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": ''The service for this container has finished working with success!!',\n  \"containerId\": \"5f58a92dfa006c8aed96f846\",\n  \"toolType\": \"REC\",\n}",
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
            "field": "Service",
            "description": "<p>Unavailable When something goes wrong with the service</p>"
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
    "title": "Run SEG tool",
    "description": "<p>Segmentation (SEG) tool. It requires to run the recognition first. In order to download the results of the segmentaion, you have to run separate API request. Please look at the &quot;Download outputs&quot; API endpoint.</p>",
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
            "description": "<p>The container ID for which you want to run the tool</p>"
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
            "description": "<p>that this tool finished working</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>the container ID which was used</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "toolType",
            "description": "<p>returns &quot;SEG&quot; string</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": ''The service for this container has finished working with success!!',\n  \"containerId\": \"5f58a92dfa006c8aed96f846\",\n  \"toolType\": \"SEG\",\n}",
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
            "field": "Service",
            "description": "<p>Unavailable When something goes wrong with the service</p>"
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
    "title": "Run VAD tool",
    "description": "<p>Voice Activity Detection (VAD) tool to recognize the speech fragments within the recording. By default, it returns the output in JSON format. However, if you want to download the output in different format, look at the &quot;Download outputs&quot; API endpoint.</p>",
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
            "description": "<p>The container ID for which you want to run the tool</p>"
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
            "description": "<p>that this tool finished working</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "containerId",
            "description": "<p>the container ID which was used</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "toolType",
            "description": "<p>returns &quot;VAD&quot; string</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "VADSegments",
            "description": "<p>returns segments with recognized voice in JSON format. If you wish to get output as a file in CTM or TextGrid format, see how to get output file</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": ''The service for this container has finished working with success!!',\n  \"containerId\": \"5f58a92dfa006c8aed96f846\",\n  \"toolType\": \"VAD\",\n  \"VADSegments\": [\n                     {\n                         \"startTime\":0.68,\n                         \"endTime\":2.74,\n                         \"editable\":true,\n                         \"color\":\"#394b55\",\n                         \"labelText\":\"speech\"\n                     },\n                     {\n                         \"startTime\":2.74,\n                         \"endTime\":5.97,\n                         \"editable\":true,\n                         \"color\":\"#394b55\",\n                         \"labelText\":\"speech\"\n                     }\n                   ]\n}",
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
            "field": "Service",
            "description": "<p>Unavailable When something goes wrong with the service</p>"
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
    "title": "Password recovery",
    "description": "<p>Allows the user to generate new password for his account. This only sends email to the user with the link which the user has to click to access the page where he will be able to enter new password</p>",
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
            "description": "<p>User email</p>"
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
            "description": "<p>that the user has been created</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>the user id created</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"message\": \"The email with further instructions has been sent\",\n}",
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
            "description": "<p>The email has not been registered</p>"
          }
        ],
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": "<p>Something went wrong in the server.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"message\": \"Something went wrong with sending the email\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/auth.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/auth/login",
    "title": "Log in",
    "description": "<p>Allows to log in of registered user and get the token</p>",
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
            "description": "<p>User email</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>User password</p>"
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
            "description": "<p>that the user has been created</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>the user id created</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"token\": eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1rbGVjQHBqd3N0ay5lZHUucGwiLCJ1c2VySWQiOiI1ZjU4YTkyZGZhMDA2YzhhZWQ5NmY4NDYiLCJpYXQiOjE2MDYzMDc1NzEsImV9cXI6MPYwNjY1MzEeMX0.-ABd2a0F3lcuI0yDV7eymq4ey5_J__xGdyYAk56icO4,\n  \"userId\": \"5f58a92dfa006c8aed96f846\"\n}",
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
            "description": "<p>can not find given email or is wrong password</p>"
          }
        ],
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": "<p>internal server error</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"message\": \"Something went wrong with loggin in the user\",\n  \"data\": undefined\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/auth.js",
    "groupTitle": "User"
  },
  {
    "type": "put",
    "url": "/auth/registration",
    "title": "Register new User",
    "description": "<p>Allows to register new user. Its necessary to run speech services using user interface and to process files in batch.</p>",
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
            "description": "<p>User email</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>User name</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>User password (min. 6 characters)</p>"
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
            "description": "<p>that the user has been created</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "userId",
            "description": "<p>the user id created</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 201 CREATED\n{\n  \"message\": 'The user has been created',\n  \"userId\": \"5f58a92dfa006c8aed96f846\"\n}",
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
            "field": "ValidationFailed",
            "description": "<p>When profided wrong data.</p>"
          }
        ],
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": "<p>When can not save the user to database.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"message\": \"\"Something went wrong with saving the user to database\",\n  \"data\": undefined\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "controllers/auth.js",
    "groupTitle": "User"
  }
] });
