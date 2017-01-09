**Set a book URL**
----
  Sets a book's flow URL.

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

  `curl https://advisor-jazzbot.mybluemix.net/set?sessionId=abc123&book=one%20http://nodered-reflect-laksri.mybluemix.net/red/flows`
  

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

  `curl https://advisor-jazzbot.mybluemix.net/use?sessionId=abc123&text=book%20one`