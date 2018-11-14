var myCodeMirror = CodeMirror.fromTextArea(document.getElementById("codepanel"),
  {
    lineNumbers: true,
    mode: "javascript"
  }
);

var myCodeMirror2 = CodeMirror.fromTextArea(document.getElementById("codepanel2"),
  {
    lineNumbers: true,
    mode: "javascript",
    // readOnly: true
  }
);

function loadExample(name,type){
  var url = './examples/'+type+name+".js";

  fetch(url)
  .then(
    response => {
      return response.text();
    }
  ).then(
    data => {
      myCodeMirror.setValue(data);
      myCodeMirror.refresh();
    }
  ).catch(
    err => {
      alert("example code to be added");
    }
  )
  url+=".txt";
  fetch(url)
  .then(
    response => {
      return response.text();
    }
  ).then(
    data => {
      var graphLog = loadLog(data);
      myCodeMirror2.setValue(graphLog.join('\n'))
      myCodeMirror2.refresh();
    }
  ).catch(
    err => {
      alert(err);
      alert("example graph to be added");
    }
  )
}

function enableDropdowns(){
  var arr = $("#menu span button");
  for(var i in arr){
    if(isNaN(i))
      continue;
    let btn = arr[i];
    let type = btn.innerText;
    let dropDownMenu = document.getElementById(type+"Dropdown")
    btn.onclick = function() {
      dropDownMenu.style.display = (dropDownMenu.style.display=="block")?"none":"block";
    }
    for(var j = 0; j < dropDownMenu.children.length; j++){
      dropDownMenu.children[j].onclick = function(event){
        loadExample(event.target.text, type);
      }
    }
  }
  window.onclick = function(event) {
    if (!event.target.matches('.dropdownbtn')) {
      var dropdowns = document.getElementsByClassName("dropdown-menu");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        openDropdown.style.display = "none";
      }
    }
  }
}

enableDropdowns();
