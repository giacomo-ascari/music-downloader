let queue = [];
let base_url = "https://asky.hopto.org/music-downloader";
//let base_url = "http://localhost:3001/music-downloader";

function remove(index) {
    document.getElementById(`main_div_${index}`).remove();
}

function retrieve(index) {
    let button = document.getElementById(`download_${index}`);
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    let plat = queue[index].plat;
    let code = queue[index].code;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", `${base_url}/retrieve?t_plat=${plat}&t_code=${code}`, true);
    xhr.onload = (e) => {
        button.disabled = false;
        if (xhr.status == 200) {
            button.className = button.className.replace("btn-primary", "btn-success");
            button.innerHTML = "READY!";
            button.onclick = () => { download(index) }
        } else {
            button.innerHTML = "Download [.mp3]";
        }
    }
    xhr.onerror = (e) => {
        button.disabled = false;
        button.innerHTML = "Download [.mp3]";
    }
    xhr.send(null);
}

function download(index) {
    document.getElementById(`download_${index}`).disabled = true;
    let filename = document.getElementById(`label_${index}`).innerHTML;
    let plat = queue[index].plat;
    let code = queue[index].code;
    let url = new URL(`${base_url}/download?t_plat=${plat}&t_code=${code}`);
    var element = document.createElement('a');
    element.style.display = 'none';
    element.href = url;
    element.download = filename;
    element.target="_blank"
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setTimeout(() => { document.getElementById(`download_${index}`).disabled = false; }, 1000);
}

function update_label(index) {
    let filename = document.getElementById(`filename_${index}`).value;
    document.getElementById(`label_${index}`).innerHTML = `${filename}.mp3`;
}

function input_div(element, cls) {
    let div = document.createElement("div");
    div.className = cls;
    div.appendChild(element);
    return div;
}

function track_div(index) {

    let main_div = document.createElement("div");
    main_div.className = "container themed-container";
    main_div.id = `main_div_${index}`;
    let div = document.createElement("div");
    div.className = "row";

    let filename_in = document.createElement("input");
    filename_in.className = "form-control";
    filename_in.value = `${queue[index].artist} - ${queue[index].title}`;
    filename_in.id = `filename_${index}`
    filename_in.type = "text";
    filename_in.placeholder = "Filename";
    filename_in.oninput = () => { update_label(index) };
    div.appendChild(input_div(filename_in, "col"));

    let submit = document.createElement("button");
    submit.className = "form-control btn btn-primary";
    submit.innerHTML = "Download [.mp3]"
    submit.id = `download_${index}`
    submit.onclick = () => { retrieve(index) }
    div.appendChild(input_div(submit, "col"));

    let rem = document.createElement("button");
    rem.className = "btn btn-danger";
    rem.innerHTML = "✖"
    rem.id = `remove_${index}`
    rem.onclick = () => { remove(index) }
    div.appendChild(input_div(rem, "col-1"));

    let label = document.createElement("i");
    label.id = `label_${index}`;
    
    main_div.appendChild(div);
    main_div.appendChild(label);
    let dyn_forms = document.getElementById("dyn_forms");
    dyn_forms.insertBefore(main_div, dyn_forms.firstChild);
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

    var xhr = new XMLHttpRequest();
    if (mode == "t") {
        xhr.open("GET", `${base_url}/info?t_plat=${plat}&t_code=${code}`, true);
        xhr.onload = (e) => {
            if (xhr.status == 200) {
                console.log("hat")
                info = JSON.parse(xhr.responseText).info;
                queue.push({plat, code, artist: (info.mediaArtist ? info.mediaArtist : info.author), title: (info.mediaSong ? info.mediaSong : info.title)});
                track_div(queue.length-1);
            } else {
                alert("ERROR");
            }
        }
        xhr.send(null);
    } else if (mode == "p") {
        xhr.open("GET", `${base_url}/info-pl?t_plat=${plat}&t_code=${code}`, false);
        xhr.onload = (e) => {
            if (xhr.status == 200) {
                info = JSON.parse(xhr.responseText).info;
                info.items.forEach(item => {
                    queue.push({plat, code: item.code, artist: info.artist, title: item.title});
                    track_div(queue.length-1);
                });
            } else {
                alert("ERROR");
            }
        }
        xhr.send(null);

    } else {
        alert("ERROR");
    }
}
