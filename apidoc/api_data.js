define({ "api": [
  {
    "type": "put",
    "url": "/registration",
    "title": "Register new User",
    "name": "GetUser",
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
            "field": "SerwerError",
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
    "description": "<p>Allows to register new user. Its necessary to run speech services using user interface and to process files in batch.</p>",
    "version": "0.0.0",
    "filename": "controllers/auth.js",
    "groupTitle": "User"
  }
] });
