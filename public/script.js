let queue = [];

function download(index) {
    document.getElementById(`download_${index}`).disabled = true;
    let filename = document.getElementById(`label_${index}`).innerHTML;
    let plat = queue[index].plat;
    let code = queue[index].code;
    //let url = new URL(`http://localhost:3001/music-downloader/track?t_plat=${plat}&t_code=${code}`);
    let url = new URL(`https://asky.hopto.org/music-downloader/track?t_plat=${plat}&t_code=${code}`);
    var element = document.createElement('a');
    element.style.display = 'none';
    element.href = url;
    element.download = filename;
    element.target="_blank"
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setTimeout(() => { document.getElementById(`download_${index}`).disabled = false; }, 5000);
  }

function input_div(element) {
    let div = document.createElement("div");
    div.className = "col";
    div.appendChild(element);
    return div;
}

function update_label(index) {
    let filename = document.getElementById(`filename_${index}`).value;
    document.getElementById(`label_${index}`).innerHTML = `${filename}.webm`;
}

function track_div(index) {

    let main_div = document.createElement("div");
    main_div.className = "container themed-container";
    let form = document.createElement("form");
    let div = document.createElement("div");
    div.className = "row";

    let filename_in = document.createElement("input");
    filename_in.className = "form-control";
    filename_in.value = `${queue[index].artist} - ${queue[index].title}`;
    filename_in.id = `filename_${index}`
    filename_in.type = "text";
    filename_in.placeholder = "Filename";
    filename_in.oninput = () => { update_label(index) };
    div.appendChild(input_div(filename_in));

    let submit = document.createElement("input");
    submit.className = "form-control btn btn-primary";
    submit.type = "button";
    submit.value = "Download [.webm]"
    submit.id = `download_${index}`
    submit.onclick = () => { download(index) }
    div.appendChild(input_div(submit));

    let label = document.createElement("i");
    label.id = `label_${index}`;
    
    form.appendChild(div);
    main_div.appendChild(form);
    main_div.appendChild(label);
    document.getElementById("dyn_forms").appendChild(main_div);
    update_label(index);

}

function add_to_queue() {
    let url = new URL(document.getElementById("input_url").value)
    document.getElementById("input_url").value = "";
    let mode;
    let code, plat;
    
    console.log(url.href);
    if (url.href.includes("youtube")) {
        console.log("YOUTUBE")
        plat = "youtube";
        mode = document.getElementById("input_mode_t").checked ? "t" : "p";
        code = document.getElementById("input_mode_t").checked ? url.href.split("v=")[1].split("&")[0] : code = url.href.split("list=")[1].split("&")[0];
    } else if (url.href.includes("youtu.be")) {
        console.log("YOUTU.BE")
        plat = "youtube";
        mode = "t";
        let s = url.href.split("/")
        code = s[s.length-1];
    }

    var xmlHttp = new XMLHttpRequest();
    if (mode == "t") {
        xmlHttp.open("GET", `https://asky.hopto.org/music-downloader/info?t_plat=${plat}&t_code=${code}`, false);
        xmlHttp.send(null);
        if (xmlHttp.status == 200) {
            info = JSON.parse(xmlHttp.responseText).info;
            queue.push({plat, code, artist: (info.mediaArtist ? info.mediaArtist : info.author), title: (info.mediaSong ? info.mediaSong : info.title)});
            track_div(queue.length-1);
        } else {
            alert("ERROR");
        }
    } else if (mode == "p") {
        xmlHttp.open("GET", `https://asky.hopto.org/music-downloader/info-pl?t_plat=${plat}&t_code=${code}`, false);
        xmlHttp.send(null);
        if (xmlHttp.status == 200) {
            info = JSON.parse(xmlHttp.responseText).info;
            info.items.forEach(item => {
                queue.push({plat, code: item.code, artist: info.artist, title: item.title});
                track_div(queue.length-1);
            });
        } else {
            alert("ERROR");
        }
    } else {
        alert("ERROR");
    }
}
