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
   
   `book=[string]` in format of \<BOOKID\>%20\<BOOKURL\>, where BOOKURL points to the URL of a NodeRed flow

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
    ```{ <br />
       message : "Which book would you like to use? Say one of the following:", <br />
       options : [ <br />
          "use book one", <br />
          "use book two", <br />
       ] <br />
    }
    ```
 
* **Error Response:**

  * **Code:** 200 <br />
    **Content:** `false`

* **Sample Call:**

  `curl https://advisor-jazzbot.mybluemix.net/set?sessionId=abc123&book=one%20http://www.samplenodered.com/red/flows`