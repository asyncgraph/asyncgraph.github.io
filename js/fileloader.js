
var codeFile = logFile = null;

var fileModal = document.getElementById('fileModal');
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
    fileModal.style.display = "block";
    // open dialog
}

function loadCustomCode(){
    var codeReader = new FileReader();

    codeReader.onload = function(e) {
        var code = codeReader.result;
        myCodeMirror.setValue(code);
        myCodeMirror.refresh();
    }

    if(codeFile === null){
        alert('code file not loaded');
        return;
    }
    codeReader.readAsText(codeFile);

    var logReader = new FileReader();
    logReader.onload = function(e) {
        var log = logReader.result;
        var logProcessed = loadLog(log);
        myCodeMirror2.setValue(logProcessed.join("\n"));
        myCodeMirror2.refresh();
    }

    if(logFile === null){
        alert('log file not loaded');
        return;
    }
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
