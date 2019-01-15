.
├── app..js
├── _docs
|   ├── Assignment_5_TimeSpend.xlsx
|   ├── final presentation.PNG
|   ├── Initial Mockup.png
|   ├── ReadMe.txt
|   ├── Trello.PNG
|   ├── Trello2.PNG
|   └── User Diagram.png
├── _siofun
|   └── client.js
├── _public
|   ├── statusResponse.wav (gets created by app.js)
|   └── index.html
├── _socket.io
|   └── socket.io.js
├── package-lock.son
├── package.son
├── log.txt (gets created by app.js)
├── _saved



The image analysis application is designed to take an uploaded image from a client and return a response that contains how many faces are present within that picture.
The information also contains locations, ages and expected gender of each face.

in this implementation, the faces are highlighted based on the mouse location over an ordered list below the output image.

there is also an option for an audio based response for accesibility reasons, so that the response can be listened to, rather than read.


Although there are minimal persisting bugs when the application is used properly, thorough testing has not be completed regarding the stability when deliberately trying to be broken,
there is an interesting quirck that an image that is uploaded UPSIDE-DOWN will be flipped right way up upon presentation, 
but the facial location highlighting will have the box in the incorrect locaiton, based upon where the face was inverted.

Proper testing regarding a large quantity of faces within an image has not been explored, it is assumed that there may be a breaking point for computation prior to trial period running out.

Future adaptions should contain better aesthetics.