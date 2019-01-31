import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import { EventEmitter } from 'events';

import { style } from './style';

let device = {
  height: window.innerHeight,
  width: window.innerWidth
}
const event = new EventEmitter(); 

let previewSize = 960;


class App extends React.Component {
  constructor(props) {
    super(props);
		this.textChange = this.textChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.saveFiles = this.saveFiles.bind(this);
    this.processStart = this.processStart.bind(this);
    this.processSecond = this.processSecond.bind(this);
    this.processThird = this.processThird.bind(this);
    this.processFinal = this.processFinal.bind(this);
		this.state = {
		  img: new Image(),
      text: '',
      size: 30,
      process: 0
		}
  }
  componentDidMount() {

    //綁定檔案input的監聽器
    var inputElement = document.getElementById("finput");
    inputElement.addEventListener("change", this.handleFiles, false);

    //處理文字位置的觸控事件
    var fakeText = document.getElementById('fake_text');
    var fakeTextShadow = document.getElementById('fake_text_shadow');
    var ongoingTouches = [];
    fakeText.addEventListener('touchstart', function(event) {
      event.preventDefault();
      var touches = event.changedTouches;
      for (var i = 0; i < touches.length; i++) {
        ongoingTouches.push(copyTouch(touches[i]));
      }
    },false)
    fakeText.addEventListener('touchmove', function(event) {
      event.preventDefault();
      var touches = event.changedTouches;
      for (var i = 0; i < touches.length; i++) {
        var idx = ongoingTouchIndexById(touches[i].identifier);
        if (idx >= 0) {
          fakeText.style.left = ongoingTouches[idx].pageX - window.innerWidth * 0.022 -10 + 'px';
          fakeText.style.top = ongoingTouches[idx].pageY - window.innerWidth * 0.04 - 55 -5 + 'px';
          fakeTextShadow.style.left = ongoingTouches[idx].pageX - window.innerWidth * 0.022 -10+ 2 + 'px';
          fakeTextShadow.style.top = ongoingTouches[idx].pageY - window.innerWidth * 0.04 - 55 -5 + 2 + 'px';
          ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
        }
      }
    }, false);

    function ongoingTouchIndexById(idToFind) {
      for (var i = 0; i < ongoingTouches.length; i++) {
        var id = ongoingTouches[i].identifier;
        
        if (id == idToFind) {
          return i;
        }
      }
      return -1;    // not found
    }

    function copyTouch(touch) {
      return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
    }

    //設定canvas圖框尺寸
    document.getElementById('image_show').width=1000;
    document.getElementById('image_show').height=1000;

    //設定process bar的監聽器
    event.on('process_start', this.processStart);
    event.on('process_second', this.processSecond);
    event.on('process_third', this.processThird);
    event.on('process_final', this.processFinal);
  }

	render() {
	    return (
	      <div id="app_background" style={style.app}>
          <div id="nav_bar" style={style.navBar}>
           <img src="assets/logo.png" style={style.logo}/>
           <div id="load_font">load font..</div>
          </div>
          <div id="process_bar" style={style.processBar}>
            <div style={style.processBarText}>{this.state.process+'%'}</div>
            <div id="process_bar_container" style={style.processBarContainer}>
              <div id="process_bar_color" style={{postion: 'absolute', left: 0, width: window.innerWidth * 0.60 * this.state.process / 100, height: window.innerWidth * 0.015, backgroundColor: '#F1A842'}}/>
              <div id="process_bar_img" style={{postion: 'absolute', left: 0, width: window.innerWidth * 0.60 * (100-this.state.process) / 100, height: window.innerWidth * 0.015}}/>
            </div>
          </div>
          <div id="preview_container" style={style.previewContainer}>
            <img id='hidden_image' src="" alt="Image preview..." style={style.preview}/>
            <img id='hidden_logo' src="/assets/logo-white.png" alt="Image preview..." style={style.preview}/>
            <div id="canvas_container" style={{position: 'relative'}}>
              <canvas ref="canvas" id="image_show" style={style.canvas}></canvas>
              <div id="fake_text_shadow" style={style.fakeTextShadow}>{this.state.text}</div>
              <div id="fake_text" style={style.fakeText}>{this.state.text}</div>
            </div>
            <label style={style.label} for="finput" id="flabel">
              <img src="assets/btn_bgc.png" style={style.btn}/>
              <div id="finput_text" style={style.btn_text}>上傳照片</div>
              <input type = "file" multiple = "false" accept = "image/*" id="finput" style={style.finput}/>
            </label>
          </div>
          <div id="text_container" style={style.textContainer}>
            <div style={style.inputLabel}>照片文字：</div>
            <input type="text" onChange={this.textChange} value={this.state.text} style={style.textInput}/>
            <div style={{height: 1, width: window.innerWidth * 0.45, backgroundColor: 'gray', position: 'absolute', top: window.innerWidth * 0.1 + 36, left: window.innerWidth * 0.38,}}/>
            <div style={style.sizeLabel}>文字大小：</div>
            <div id="sizeInputBtnS" class="size_btn" style={style.sizeInputBtnS} onClick={this.setTextS.bind(this)}>小</div>
            <div id="sizeInputBtnM" class="size_btn" style={style.sizeInputBtnM} onClick={this.setTextM.bind(this)}>中</div>
            <div id="sizeInputBtnL" class="size_btn" style={style.sizeInputBtnL} onClick={this.setTextL.bind(this)}>大</div>
          </div>
          <div id="img_container" style={style.imgContainer}>
            <img id="canvas_to_img" src="" height={window.innerWidth * 0.9} style={{zIndex:3}}/>
          </div>
	      </div>
	    );
  }

  handleFiles() {
    console.log('handle files..');
    const file = this.files[0]; 
    var reader  = new FileReader();
    var preview = document.getElementById('hidden_image');

    reader.addEventListener("load", function () {
      preview.src = reader.result;
      preview.addEventListener('load', () => {

        //canvas 繪製圖片
        document.getElementById('image_show').width=preview.width;
        document.getElementById('image_show').height=preview.height;
        device.height = preview.height;
        device.width = preview.width;
        previewSize = preview.width;
        const radio = preview.width/960;
        const ctx = document.getElementById('image_show').getContext('2d');
        ctx.drawImage(preview,0,0,preview.width,preview.height);
        console.log(`繪製圖片，長寬:${preview.width} x ${preview.height}`)

        //換成下一個按鈕
        var item = document.getElementById("finput");
        item.parentNode.removeChild(item);
        var changeItem = document.getElementById("finput_text");
        changeItem.setAttribute("id", "ok_text");
        changeItem.innerHTML = '確定';
        var okElement = document.getElementById("ok_text");
        okElement.addEventListener("click", ()=>{

          //開始做圖
          $('#process_bar').height(window.innerWidth * 0.16);
          setTimeout(() => {
            event.emit('process_start');
            document.getElementById('fake_text_shadow').style.display = 'none';
            document.getElementById('fake_text').style.display = 'none';
            var previewLogo = document.getElementById('hidden_logo');
            ctx.drawImage(previewLogo,0,0,previewLogo.width,previewLogo.height, 800*radio,20*radio,140*radio,140*radio);
          }, 800);

          //第二步開始
          setTimeout(()=>{
            event.emit('process_second');
          },1400)
          setTimeout(()=>{
            event.emit('process_third');
          },2000)
          setTimeout(()=>{
            event.emit('process_final');
          },3000)
          
        }, false);
      }, false)  
    }, false);
  
    if (file) {
      reader.readAsDataURL(file);
    }

  }
  saveFiles(files){
    const img = this.state.img;
    img.push = files;
    this.setState({img})
    console.log(this.state.img);
  }
	textChange(e) {
    const text = e.target.value;
    this.setState({text});
  }
  onInput() {
    var input = document.getElementById("typeinp");
    var size = input.value;
    this.setState({ size })
  }
	handleSubmit(e) {
    e.preventDefault();
  }
  processStart(){
    const interval = setInterval(()=>{
      const process = this.state.process + Math.floor(Math.random()*3);
      if(process < 30){
        this.setState({process});
      }else{
        this.setState({process: 25});
        clearInterval(interval);
      }
    },40);  
  }
  processSecond(){
    const ctx = document.getElementById('image_show').getContext('2d');
    const fakeTextTop = parseInt(document.getElementById('fake_text_shadow').style.top,10) + window.innerWidth * 0.03 -2;
    const fakeTextLeft = parseInt(document.getElementById('fake_text_shadow').style.left,10) - window.innerWidth * 0.13-1.25;
    console.log(`取得文字位置，top:${fakeTextTop}, left:${fakeTextLeft}`);
    const radio = previewSize /(window.innerWidth * 0.7);
    const interval = setInterval(()=>{
      const process = this.state.process + Math.floor(Math.random()*3);
        if(process < 55){
          this.setState({process});
        }else{
          this.setState({process:50});
          clearInterval(interval);
        }
      },40);  
    ctx.font = this.state.size * radio +"px MarufoPro";
    console.log(`計算字體大小，網頁上大小:${this.state.size}、轉換後畫布上大小:${this.state.size * radio}`);
    ctx.fillStyle = "black";
    ctx.fillText(this.state.text, fakeTextLeft * radio + 2 * radio, fakeTextTop * radio + 100 + 2 * radio); 
    console.log(`繪出字體，位置 left:${fakeTextLeft * radio}, top: ${fakeTextTop * radio}`);
  }
  processThird(){
    const ctx = document.getElementById('image_show').getContext('2d');
    const fakeTextTop = parseInt(document.getElementById('fake_text_shadow').style.top,10) + window.innerWidth * 0.03 -2;
    const fakeTextLeft = parseInt(document.getElementById('fake_text_shadow').style.left,10) - window.innerWidth * 0.13-1.25;
    const radio = previewSize /(window.innerWidth * 0.7);
    const interval = setInterval(()=>{
      const process = this.state.process + Math.floor(Math.random()*3);
        if(process < 80){
          this.setState({process});
        }else{
          this.setState({process:75});
          clearInterval(interval);
        }
      },40);  
    ctx.font = this.state.size * radio +"px MarufoPro";
    ctx.fillStyle = "white";
    ctx.fillText(this.state.text, fakeTextLeft * radio, fakeTextTop * radio + 100); 
  }
  processFinal(){
    const interval = setInterval(()=>{
      const process = this.state.process + Math.floor(Math.random()*3);
        if(process < 100){
          this.setState({process});
        }else{
          this.setState({process:100});
          clearInterval(interval);
          const canvas = document.getElementById("image_show");
          var dataURL = canvas.toDataURL();
          document.getElementById('canvas_to_img').src = dataURL;
          document.getElementById('img_container').style.display = 'flex';
          setTimeout(()=>{
            $('#app_background').height(100 + window.innerWidth * 2.65);
            $('html, body').animate({scrollTop: 9999},600)
          },600);
        }
      },40);  
  }

  setTextS(){
    this.setState({size: 20});
    console.log("size: 20");
    document.getElementById('sizeInputBtnS').style.backgroundColor = 'rgb(230,230,230)';
    document.getElementById('sizeInputBtnM').style.backgroundColor = '#FFF';
    document.getElementById('sizeInputBtnL').style.backgroundColor = '#FFF';
    document.getElementById('fake_text_shadow').style.fontSize = '20px';
    document.getElementById('fake_text').style.fontSize = '20px';
  }
  setTextM(){
    this.setState({size: 35});
    console.log("size: 35");
    document.getElementById('sizeInputBtnM').style.backgroundColor = 'rgb(230,230,230)';
    document.getElementById('sizeInputBtnS').style.backgroundColor = '#FFF';
    document.getElementById('sizeInputBtnL').style.backgroundColor = '#FFF';
    document.getElementById('fake_text_shadow').style.fontSize = '35px';
    document.getElementById('fake_text').style.fontSize = '35px';
  }
  setTextL(){
    this.setState({size: 50});
    console.log("size: 50");
    document.getElementById('sizeInputBtnL').style.backgroundColor = 'rgb(230,230,230)';
    document.getElementById('sizeInputBtnM').style.backgroundColor = '#FFF';
    document.getElementById('sizeInputBtnS').style.backgroundColor = '#FFF';
    document.getElementById('fake_text_shadow').style.fontSize = '50px';
    document.getElementById('fake_text').style.fontSize = '50px';
  }

  
}

ReactDOM.render(<App />, document.getElementById('app'));