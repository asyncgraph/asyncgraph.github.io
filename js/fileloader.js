const codeReader = new FileReader();
const logReader = new FileReader();
var codeFile = logFile = null;

var fileModal = document.getElementById('fileModal');

codeReader.onload = function(e) {
    var code = codeReader.result;
    myCodeMirror.setValue(code);
    myCodeMirror.refresh();
}

logReader.onload = function(e) {
    var log = logReader.result;
    var logProcessed = loadLog(log);
    myCodeMirror2.setValue(logProcessed.join("\n"));
    myCodeMirror2.refresh();
}

function handleFile(type, files){
    if(files.length == 0){
        alert("Error loading file");
        // console.log(files);
        return;
    }else  if(files.length > 1){
      alert("Only one file a time!");
      // console.log(files);
      return;
    }
    if(type == 0) {
      codeFile = files[0];
    } else {
      logFile = files[0];
    }
}

function openFileLoaderDialog(){
    var codeFile = logFile = null;
    fileModal.style.display = "block";
    // open dialog
}

function loadCustomCode(){
    if(codeFile === null){
        alert('code file not loaded');
    }
    if(logFile === null){
        alert('log file not loaded');
    }
    codeReader.readAsText(codeFile);
    logReader.readAsText(logFile);
    fileModal.style.display = "none";
}

function doConfirm(load) {
    if(load) {
        loadCustomCode();
    }
    else{
        fileModal.style.display = "none";
    }
}

window.onclick = function(event) {
    if (event.target == fileModal) {
        fileModal.style.display = "none";
    }
}
