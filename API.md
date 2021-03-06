**Table of Contents**
----

Item | URL | Description
--- | --- | ---
[Set a book URL](#set-a-book-url) | `/set` | Sets a book's flow URL. It also accepts a key-value pair in the parameter, such as `answer=yes`
[Use a book](#use-a-book) | `/use` | Selects a book to be used
[Start chapter](#start-chapter) | `/start` | Starts a single chapter or all chapters
[Reply question](#reply-question) | `/reply` | Provide an answer based on the options given, either in number or an actual answer sentence
[List books or chapters](#list-books-or-chapters) | `/list` | Provide the list of available books or chapters

---


**Set a book URL**
----
  Sets a book's flow URL. It also accepts a key-value pair in the parameter, such as `answer=yes`

* **URL**

  /set

* **Method:**

  `GET`
  
*  **URL Params**

   **Required:**
 
   `sessionId=[string]`
   
   `book=[string]` in format of `<BOOKID>%20<BOOKURL>`, where `BOOKURL` points to the URL of a NodeRed flow

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** <br />
    ```{  
       message : "Which book would you like to use? Say one of the following:",  
       options : [  
          "use book one",  
          "use book two"  
       ]  
    }```
 
* **Sample Call:**

Chat | CURL Command
--- | ---
`set book one http://nodered-reflect.mybluemix.net/red/flows` | `curl https://advisor-jazzbot.mybluemix.net/set?sessionId=abc123&book=one%20http://nodered-reflect.mybluemix.net/red/flows`
  
---

**Use a book**
----
  Selects a book to be used.

* **URL**

  /use

* **Method:**

  `GET`
  
*  **URL Params**

   **Required:**
 
   `sessionId=[string]`
   
   `text=[string]` in format of `book%20<BOOKID>`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** <br />
    ```{  
       message : "How would you like to start the chapters? Say one of the following:",  
       options : [  
          "start chapter 1 (for Chapter ABC)",
          "start chapter 2 (for Chapter XYZ)",  
          "start all chapters in order",  
          "start all chapters in random"  
       ]  
    }```

* **Sample Call:**

Chat | CURL Command
--- | ---
`use book one` | `curl https://advisor-jazzbot.mybluemix.net/use?sessionId=abc123&text=book%20one`
  
---

**Start chapter**
----
  Starts a single chapter or all chapters

* **URL**

  /start

* **Method:**

  `GET`
  
*  **URL Params**

   **Required:**
 
   `sessionId=[string]`
   
   `text=[string]` in format of either `chapter%20<CHAPTERID>` or `all%20chapters` or `all%20chapters%20in%20random` or `next%20chapter` 

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** <br />
    ```{  
       message : "This is a question with some options:",  
       options : [  
          "1 : yes",
          "2 : no",  
          "3 : maybe"  
       ]  
    }```

* **Sample Calls:**

Chat | CURL Command
--- | ---
`start chapter four` | `curl https://advisor-jazzbot.mybluemix.net/start?sessionId=abc123&text=chapter%20four`
`start all chapters` | `curl https://advisor-jazzbot.mybluemix.net/start?sessionId=abc123&text=all%20chapters`
`start all chapters in random` | `curl https://advisor-jazzbot.mybluemix.net/start?sessionId=abc123&text=all%20chapters%20in%20random`
`start next chapter` | `curl https://advisor-jazzbot.mybluemix.net/start?sessionId=abc123&text=next%20chapter`
    
---

**Reply question**
----
  Provide an answer based on the options given, either in number or an actual answer sentence

* **URL**

  /reply or /number

* **Method:**

  `GET`
  
*  **URL Params**

   **Required:**
 
   `sessionId=[string]`
   
   `text=[string]` in format of either `<NUMBER>` or `<SPELLED_NUMBER>` or `<OPTION>` 

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** <br />
    ```{  
       message : "This is the next question with some options:",  
       options : [  
          "1 : yes",
          "2 : no",  
          "3 : maybe"  
       ]  
    }```

* **Sample Calls:**

Chat | CURL Command
--- | ---
`reply 1` | `curl https://advisor-jazzbot.mybluemix.net/reply?sessionId=abc123&text=1`
`reply two` | `curl https://advisor-jazzbot.mybluemix.net/reply?sessionId=abc123&text=two`
`reply maybe` | `curl https://advisor-jazzbot.mybluemix.net/reply?sessionId=abc123&text=maybe`
    
---

**List books or chapters**
----
  Provide the list of available books or chapters

* **URL**

  /list

* **Method:**

  `GET`
  
*  **URL Params**

   **Required:**
 
   `sessionId=[string]`
   
   `text=books|chapters` 

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** <br />
    ```{  
       message : "Here are the available book(s):",  
       options : [  
          "one : http://nodered-reflect.mybluemix.net/red/flows",
          "two : http://nodered-reflect-abc.mybluemix.net/red/flows"  
       ]  
    }```

  * **Code:** 200 <br />
    **Content:** <br />
    ```{  
       message : "Here are the available chapter(s):",  
       options : [  
          "one : Chapter Lamp Control",
          "two : Chapter Survey",
          "three : Chapter Lamp",
          "four : Chapter Network Troubleshoot"  
       ]  
    }```

* **Sample Calls:**

Chat | CURL Command
--- | ---
`list books` | `curl https://advisor-jazzbot.mybluemix.net/list?sessionId=abc123&text=books`
`list chapter` | `curl https://advisor-jazzbot.mybluemix.net/list?sessionId=abc123&text=chapters`
  
