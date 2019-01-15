// Require libraries

// This allows socket to send and receive files
var SocketIOFileUpload = require('socketio-file-upload');

var socketio = require('socket.io');
var express = require('express');

// Make your express server
var app = express()
    .use(SocketIOFileUpload.router)
    .use(express.static('public'))
    .listen(8000);

// File Service for logging and reading saved data
var fs = require('fs');
var stream = fs.createWriteStream("log.txt", {flags:'a'});

// Watson Utilities and login details
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var visualRecognition = new VisualRecognitionV3({
    version: '2018-03-19',
    api_key: '636c2063bfe14a468bd067bdb9888606be917ab9'
});
var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1')
let text_to_speech = new TextToSpeechV1({
    username : "abe03e3e-de12-425a-a547-1e6947174418",
    password : "50tscSO0vCfm"
});

// Start up Socket.IO:
var io = socketio.listen(app);

// Client joins
io.sockets.on("connection", function(socket){

    // Log user ID and timestamp
    stream.write(new Date().toISOString() + socket.id +' -- Client Joined\r\n');
    socket.emit('status','WELCOME TO FACIAL ANALYSIS - UPLOAD A PICTURE TO BEGIN')

    // Initialise the promise so that the client receives information in order
    // This method is used to send all of the analysis responses to the client via emit.
    var emitClient = function(data) {

        var promise = new Promise(function(resolve, reject){

            stream.write(new Date().toISOString() + socket.id +' -- Response Sent to Client\r\n \r\n');
            socket.emit('face',data.response)
            socket.emit('status','UPLOAD ANOTHER IMAGE TO START AGAIN')
            resolve(data);
        });
        return promise;
    };

    // Make an instance of SocketIOFileUpload and listen on this socket:
    var uploader = new SocketIOFileUpload();
    uploader.dir = "public/saved";
    uploader.listen(socket);

    // Do something when a file is saved:
    // When we receive confirmation of a saved file, we begin the analysis steps in order, they can only be completed sequentially
    uploader.on("saved", function(event){
        // Log that we have received a picture
        stream.write(new Date().toISOString() + socket.id + ' -- File Uploaded from Client\r\r\n' );

        // log the file
        stream.write(new Date().toISOString() + socket.id + event.file.pathName);

	// emit pathName with such substring so HTML can locate image and display it
        socket.emit('filename', event.file.pathName.substring(6));
        socket.emit('status','Image received, beginning analysis')
        // Analyse functions at bottom called in sequence
        imageAnalysis(socket.id,event.file.pathName.substring(6)).then(textSpeech).then(emitClient);
    });

    // Error handler:
    uploader.on("error", function(event){
        stream.write(new Date().toISOString() + socket.id + ' -- Error in File Upload\r\r\n' );
    });
});

// we're listening
console.log("listening on: 8000");


// Function regarding finding how man faces are within the supplied file
var imageAnalysis = function(sid,image) {

    // find the picture
    var images_file = fs.createReadStream('./public/'+image);

    // define the promise
    var promise = new Promise(function(resolve, reject){

        var statusString = '';
        var faceLocations = [];
        var analysisResponse = {};

        //keeping the Socket ID if necessary down the track
        analysisResponse['sid'] = sid;
        stream.write(new Date().toISOString() + ' -- Analysis Start\r\n');
        visualRecognition.detectFaces({images_file:images_file}, function(err, response) {

            // if error
            if (err){
                console.log(err);
                stream.write(new Date().toISOString() + socket.id + ' -- Error in file analysis\r\n' );
                stream.write(err + ' -- Analysis Error\r\n' );
                reject(err)

                // otherwise
            } else {
                // creating a response string that identifies what analysis we have found
                statusString +=  'The image has ' + response.images[0].faces.length + ' faces.\r\n';

                // looping for each face, we update the response string so that we cover each face
                var i;
                for (i = 0; i < response.images[0].faces.length; i++){
                    statusString += 'Face Number ' + (i+1) + ' is most likely a ' + response.images[0].faces[i].gender.gender +
                        ' and the average age is ' + (Math.floor(response.images[0].faces[i].age.max - response.images[0].faces[i].age.min)/2 +
                            response.images[0].faces[i].age.min) + '.\n';
                    faceLocations.push(response.images[0].faces[i].face_location)
                }
            }

            // storing the response in a meaningful way
            analysisResponse['status'] = statusString;
            analysisResponse['response'] = response;

            //log complete
            stream.write(new Date().toISOString() + ' -- Analysis Complete <br/>');

            // continue
            resolve(analysisResponse)
        });
    });
    return promise;
};


var textSpeech = function(data) {
    var promise = new Promise(function(resolve, reject){

        // log beginning text to speech
        stream.write(new Date().toISOString() + ' -- Turning Response into Speech\r\n');

        // parameters for output voice and string to synthesise
        var paramsVoice = {
            text: data.status,
            voice: 'en-US_AllisonVoice',
            accept: 'audio/wav'
        };

        //complete the synthesising of the string to audio
        text_to_speech.synthesize(paramsVoice).on('error', function (error) {

            // upon failure...
            stream.write(error + ' -- Text to Speech Error\r\n' );
            reject('Error:', error);

            //saved to 'public' directory
        }).pipe(fs.createWriteStream('./public/statusResponse.wav'));

        //continue
        resolve(data)
    });
    return promise;
};






