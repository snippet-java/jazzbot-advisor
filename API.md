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
   
   `book=[string]` in format of <BOOKID>%20<BOOKURL>

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ message : "Which book would you like to use? Say one of the following:", options : ["use book one"] }`
 
* **Error Response:**

  * **Code:** 200 <br />
    **Content:** `false`

* **Sample Call:**

  ```curl http://www.test.com/set?sessionId=abc123&book=one%20http://www.samplenodered.com/red/flows```