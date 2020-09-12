/**
 * @name No Upload Limit
 * @invite 2x3uYRv
 * @authorLink https://twitter.com/FlafyDev
 * @donate https://paypal.me/flafyarazi
 * @website http://flafy.herokuapp.com/
 * @source https://raw.githubusercontent.com/FlafyDev/BetterDiscordPlugins/master/Plugins/NoUploadLimit/NoUploadLimit.plugin.js
 */
var NoUploadLimit = (_ => {
  var videos = {}, amounts = {}, switches = {}

  const uploadIconPath = `
		<svg aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
		  <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M16.293 9.293L17.707 10.707L12 16.414L6.29297 10.707L7.70697 9.293L11 12.586V2H13V12.586L16.293 9.293ZM18" transform="scale(1.2, -1.2) translate(-2, -17)"/>
		  
		  <path fill="currentColor" fill-rule="evenodd"  clip-rule="evenodd" d="M0 .586L16.293 9.293ZM18 20V18H20V20C20 21.102 19.104 22 18 22H6C4.896 22 4 21.102 4 20V18H6V20H18Z" transform="scale(1.2, 1.2) translate(0, -)"/>
		</svg>
	`

	return class NoUploadLimit {
		getName () {return "No Upload Limit";}

		getVersion () {return "0.1";}

		getAuthor () {return "Flafy";}

		getDescription () {return "Several alternative ways to upload files, images and videos through discord.";}
		
		constructor () {
			Number.prototype.clamp = function(min, max) {
				return Math.min(Math.max(this, min), max);
			};	
			
			window.noUploadLimitThis = this;
			this.didReload = false;
			
			
			this.patchedModules = {
				before: {
					ChannelTextAreaForm: "render",
					ChannelEditorContainer: "render"
				},
				after: {
					ChannelTextAreaContainer: "render"
				}
			};
		}

		// Settings
		initConstructor () {
			var streamableLink = BDFDB.ReactUtils.createElement("a", {
				className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._repolink, "Login to Streamable (Required for videos)"),
				href: "https://streamable.com/signup",
				children: "Login to Streamable (Required for videos)",
				rel: "noreferrer noopener",
				target: "_blank"
			})
			
			this.defaults = {
				amounts: {
					uploadLimit:			{value:100, min:8, max:1500, title:"Upload limit (MB)"}
				},
				switches: {
					advancedButtons:			{value:false, title:"Show a seperate button for files, images and videos"}
				},
				videos: {
					streamableUsername: 	{value:"",	description:"Email or username", title: streamableLink, style: {}},
					streamablePass:			{value:"", 	description:"Password", title:" ", style: {"-webkit-text-security": "disc"}}
				}
			};
		}
		
		getSettingsPanel () {
			if (!this.BDFDB || typeof BDFDB != "object" || !BDFDB.loaded || !this.started) return;
			let switches = BDFDB.DataUtils.get(this, "switches");
			let videos = BDFDB.DataUtils.get(this, "videos");
			let amounts = BDFDB.DataUtils.get(this, "amounts");
			let settingsPanel, settingsItems = [];
			
			for (let key in switches) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
				className: BDFDB.disCN.marginbottom8,
				type: "Switch",
				plugin: this,
				label: this.defaults.switches[key].title,
				keys: ["switches", key],
				value: switches[key]
			}));
			
			for (let key in amounts) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
				type: "TextInput",
				childProps: {
					type: "number"
				},
				plugin: this,
				keys: ["amounts", key],
				label: this.defaults.amounts[key].title,
				basis: "20%",
				min: this.defaults.amounts[key].min,
				max: this.defaults.amounts[key].max,
				value: amounts[key]
			}));
			
			settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
				className: BDFDB.disCN.marginbottom8
			}));
			
			for (let key in videos) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
				className: BDFDB.disCN.marginbottom8,
				type: "TextInput",
				style: this.defaults.videos[key].style,
				plugin: this,
				label: this.defaults.videos[key].title,
				keys: ["videos", key],
				placeholder: this.defaults.videos[key].description,
				value: videos[key]
			}));
			
			settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
				className: BDFDB.disCN.marginbottom8
			}));
			
			return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, settingsItems);
		}

		forceUpdateAll () {
			switches = BDFDB.DataUtils.get(this, "switches");
			videos = BDFDB.DataUtils.get(this, "videos");
			amounts = BDFDB.DataUtils.get(this, "amounts");
	
			amounts.uploadLimit = Number(amounts.uploadLimit).clamp(8,1500);
			BDFDB.DataUtils.save(amounts, this, "amounts");
			
			BDFDB.ModuleUtils.forceAllUpdates(this);
			BDFDB.MessageUtils.rerenderAll();
		}
		
		onSettingsClosed () {
			if (this.SettingsUpdated) {
				delete this.SettingsUpdated;
				this.forceUpdateAll();
			}
		}
		
		// Legacy
		load () {}

		start () {	
			if (!this.BDFDB) this.BDFDB = {myPlugins:{}};
			if (this.BDFDB && this.BDFDB.myPlugins && typeof this.BDFDB.myPlugins == "object") this.BDFDB.myPlugins[this.getName()] = this;
			let libraryScript = document.querySelector("head script#BDFDBLibraryScript");
			if (!libraryScript || (performance.now() - libraryScript.getAttribute("date")) > 600000) {
				if (libraryScript) libraryScript.remove();
				libraryScript = document.createElement("script");
				libraryScript.setAttribute("id", "BDFDBLibraryScript");
				libraryScript.setAttribute("type", "text/javascript");
				libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.min.js");
				libraryScript.setAttribute("date", performance.now());
				libraryScript.addEventListener("load", _ => {this.initialize();});
				document.head.appendChild(libraryScript);
			}
			else if (this.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) this.initialize();
			this.startTimeout = setTimeout(_ => {
				try {return this.initialize();}
				catch (err) {console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not initiate plugin! " + err);}
			}, 30000);
			
			this.uploadPopupOpened = true;
			this.uploadLastTime = new Date();
			this.uploadPopup = null;
			this.uploadPercentageElementPreText = "";
			this.uploadProcessElementPreText = "";
			this.uploadNameElementPreText = "";
			this.uploadButtonsDisabled = false;
			this.lastFilesDropped = undefined;
			this.uploadsButton = null;
			
			// Video
			this.uploadVideoSelector = document.createElement('input');
			this.uploadVideoSelector.type = 'file';
			this.uploadVideoSelector.accept = ".mp4,.mov,.mpeg4,.avi\.wmv,.mpegps,.flv,.webm"
			this.uploadVideoAllowedExtensions = /(\.mp4|\.mov|\.mpeg4|\.avi\.wmv|\.mpegps|\.flv|\.webm)$/i; 
			this.uploadVideoSelectorFunction = function (file) {
				if (file.size > amounts.uploadLimit * 1000000) {
					BdApi.alert("Reached upload limit", `Max file size is ${amounts.uploadLimit} MB.\n\nThe limit can be changed in the plugins's settings.`);
				} else {
					this.streamableUpload(file);
				}
			}
			this.uploadVideoSelector.onchange = e => { 
				var file = e.target.files[0];
				if (this.uploadButtonsDisabled == false) {
					if (this.uploadVideoAllowedExtensions.exec(file.name)) {
						this.uploadVideoSelectorFunction.call(this, file)
					} else {
						BdApi.alert("Invalid image file type", "Images must be any of the following types:\n\n.mp4\n\n.mov\n\n.mpeg4\n\n.avi\n\n.wmv\n\n.mpegps\n\n.flv\n\n.webm");
					}
				} else {
					BdApi.alert("Can't upload multiple files at once", 'The plugin "No Upload Limit" cannot upload multiple files at once.\n\nTo cancel the current upload restart discord with CTRL+R.');
				}
				
				e.target.value = null;
			}
			
			// Image
			this.uploadImageSelector = document.createElement('input');
			this.uploadImageSelector.type = 'file';
			this.uploadImageSelector.accept = ".jpeg,.jpg,.png,.gif";
			this.uploadImageAllowedExtensions = /(\.jpeg|\.jpg|\.png|\.gif)$/i;
			this.uploadImageSelectorFunction = function (file) {
				if (file.size > amounts.uploadLimit * 1000000) {
					BdApi.alert("Reached upload limit", `Max file size is ${amounts.uploadLimit} MB.\n\nThe limit can be changed in the plugins's settings.`);
				} else {
					this.imgurUpload(file);
				}
			}
			this.uploadImageSelector.onchange = e => { 
				var file = e.target.files[0];

				if (this.uploadButtonsDisabled == false) {
					if (this.uploadImageAllowedExtensions.exec(file.name)) {
						this.uploadImageSelectorFunction.call(this, file)
					} else {
						BdApi.alert("Invalid image file type", "Images must be any of the following types:\n\n.jpeg\n\n.jpg\n\n.png\n\n.gif");
					}
				} else {
					BdApi.alert("Can't upload multiple files at once", 'The plugin "No Upload Limit" cannot upload multiple files at once.\n\nTo cancel the current upload restart discord with CTRL+R.');
				}
				
				e.target.value = null;
			}

			// File
			this.uploadFileSelector = document.createElement('input');
			this.uploadFileSelector.type = 'file';
			this.uploadFileSelectorFunction = function (file) {
				if (file.size > amounts.uploadLimit * 1000000) {
					BdApi.alert("Reached upload limit", `Max file size is ${amounts.uploadLimit} MB.\n\nThe limit can be changed in the plugins's settings.`);
				} else {
					this.goFileUpload(file);
				}
			}
			this.uploadFileSelector.onchange = e => { 
				var file = e.target.files[0];
				
				if (this.uploadButtonsDisabled == false) {
					this.uploadFileSelectorFunction.call(this, file);
				} else {
					BdApi.alert("Can't upload multiple files at once", 'The plugin "No Upload Limit" cannot upload multiple files at once.\n\nTo cancel the current upload restart discord with CTRL+R.');
				}
				
				e.target.value = null;
			}

			// Auto
			this.uploadAutoSelector = document.createElement('input');
			this.uploadAutoSelector.type = 'file';
			this.uploadAutoSelectorFunction = function (file) {
				if (this.uploadButtonsDisabled == false) {
					if (this.uploadVideoAllowedExtensions.exec(file.name)) {
						this.uploadVideoSelectorFunction.call(this, file);
					} else if (this.uploadImageAllowedExtensions.exec(file.name)) {
						this.uploadImageSelectorFunction.call(this, file);
					} else {
						this.uploadFileSelectorFunction.call(this, file);
					}
				} else {
					BdApi.alert("Can't upload multiple files at once", 'The plugin "No Upload Limit" cannot upload multiple files at once.\n\nTo cancel the current upload restart discord with CTRL+R.');
				}
			}
			this.uploadAutoSelector.onchange = e => { 
				var file = e.target.files[0];
				
				this.uploadAutoSelectorFunction(file);
				
				e.target.value = null;
			}
			
			this.reloadPopup = function() {
				if (this.uploadButtonsDisabled == false) {
					this.uploadPercentageElementPreText = "";
					this.uploadProcessElementPreText = "";
					this.uploadNameElementPreText = "";
				}
				
				try {
					var buttonAuto = BDFDB.ReactUtils.findOwner(this.uploadPopup, {key: "button-auto"})
					buttonAuto.props.disabled = this.uploadButtonsDisabled;
				} catch {}
				
				try {
					var buttonFile = BDFDB.ReactUtils.findOwner(this.uploadPopup, {key: "button-file"})
					buttonFile.props.disabled = this.uploadButtonsDisabled;
				} catch {}
				
				try {
					var buttonImage = BDFDB.ReactUtils.findOwner(this.uploadPopup, {key: "button-image"})
					buttonImage.props.disabled = this.uploadButtonsDisabled;
				} catch {}
				
				try {
					var buttonVideo = BDFDB.ReactUtils.findOwner(this.uploadPopup, {key: "button-video"})
					buttonVideo.props.disabled = this.uploadButtonsDisabled;
				} catch {}	
				
				try {
					var uploadPercentageElement = BDFDB.ReactUtils.findOwner(this.uploadPopup, {key: "upload-percentage"})
					uploadPercentageElement.props.label = this.uploadPercentageElementPreText;
				} catch {}	
				
				try {
					var uploadProgressElement = BDFDB.ReactUtils.findOwner(this.uploadPopup, {key: "upload-progress"})
					uploadProgressElement.props.label = this.uploadProcessElementPreText;
				} catch {}
				
				try {
					var uploadNameElement = BDFDB.ReactUtils.findOwner(this.uploadPopup, {key: "upload-name"})
					uploadNameElement.props.label = this.uploadNameElementPreText;
				} catch {}
				
				BDFDB.ReactUtils.forceUpdate(this.uploadPopup);
				
			}
			
			
			/*this.uploadArea = document.getElementsByClassName("da-uploadArea")[0];
			this.uploadAreaDropFunction = function(e) { event.preventDefault(); console.log(window.noUploadLimitThis, this, event.dataTransfer.files[0]); if (event.dataTransfer.files[1] == undefined) {window.noUploadLimitThis.lastFilesDropped = event.dataTransfer.files[0]} else {window.noUploadLimitThis.lastFilesDropped = undefined} }


			this.uploadAreaDropListenerInterval = setInterval(function() { 			
				this.uploadArea = document.getElementsByClassName("da-uploadArea")[0];
				console.log(window.noUploadLimitThis.uploadArea, window.noUploadLimitThis.uploadAreaDropFunction);
				window.noUploadLimitThis.uploadArea.addEventListener("drop", window.noUploadLimitThis.uploadAreaDropFunction, true)
			}, 5000);*/
			

			this.uploadArea = document.getElementsByClassName(BdApi.findModuleByProps('uploadArea').uploadArea)[0]
			
			
			this.uploadPromptToUploadPatch = BdApi.monkeyPatch(this.uploadArea.__reactInternalInstance$.return.stateNode, "promptToUpload", {
				before: (e) => {
					var files = e.methodArguments[0]
					console.log("FILESS", files);
					if (files[1] == undefined) {
						window.noUploadLimitThis.lastFilesDropped = files[0]
					} else {
						window.noUploadLimitThis.lastFilesDropped = "multi";
					}
				}
			});
			
			this.uploadErrorPatch = BdApi.monkeyPatch(BdApi.findModule(m => m.displayName === 'UploadError').prototype, 'render', {
				instead: (e) => {
					try {
						console.log(window.noUploadLimitThis.lastFilesDropped);
						
						if (window.noUploadLimitThis.lastFilesDropped != undefined) {
							var file = window.noUploadLimitThis.lastFilesDropped;
							window.noUploadLimitThis.lastFilesDropped = undefined;
							window.noUploadLimitThis.uploadAutoSelectorFunction.call(window.noUploadLimitThis, file);
						} else if (window.noUploadLimitThis.lastFilesDropped === "multi") {
							BdApi.alert("Can't upload multiple files at once", 'The plugin "No Upload Limit" cannot upload multiple files at once.\n\nTo cancel the current upload restart discord with CTRL+R.');
						}
					} catch (e) {
						console.log(e);
						BDFDB.NotificationUtils.toast("Failed to upload file from drag and drop. (errno 1)", {type:"error"});
					}
					
					setTimeout(function () {
						try {
							document.getElementsByClassName("da-backdrop")[0].click()
						} catch {}
					}, 1)
					
					return [];
				}
			});

			// Reload again when starting discord.
			var an_element_exists = document.getElementById("NULon")
			console.log("ELE EXISTS?", an_element_exists);
			if (an_element_exists == undefined) {
				var an_element = document.createElement("div");
				an_element.id = "NULon"
				document.head.appendChild(an_element)
				console.log("did element");
				setTimeout( _ => {
					BdApi.Plugins.reload(this.getName());
				}, 1000)
			}
		}

		initialize () {
			if (this.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
				if (this.started) return;
				BDFDB.PluginUtils.init(this);
				
				this.forceUpdateAll();
			}
			else console.error(`%c[${this.getName()}]%c`, "color: #3a71c1; font-weight: 700;", "", "Fatal Error: Could not load BD functions!");
		
			
		}

		stop () {
			if (this.BDFDB && typeof BDFDB === "object" && BDFDB.loaded) {
				this.stopping = true;
				
				clearInterval(this.uploadAreaDropListenerInterval);
				window.noUploadLimitThis.uploadArea.removeEventListener("drop", window.noUploadLimitThis.uploadAreaDropFunction);
				
				if (this.uploadErrorPatch) {
					this.uploadErrorPatch();
					delete this.uploadErrorPatch;
				}
				if (this.uploadPromptToUploadPatch) {
					this.uploadPromptToUploadPatch();
					delete this.uploadPromptToUploadPatch;
				}
				
				this.forceUpdateAll();

				BDFDB.PluginUtils.clear(this);
			}
		
			
		}


		// Begin of own functions
		
		isValidTree (obj) {
			return obj !== null && (Array.isArray(obj) || typeof obj === 'object');
		}
		
		findInTree (tree, filter, opts = {}) {
			if (!this.isValidTree(tree)) return null;
			if (filter(tree)) return tree;

			const { walkable = null, ignore = [] } = opts;

			const queue = [tree];

			while (queue.length) {
				const curr = queue.shift();

				if (Array.isArray(curr)) {
					for (const element of curr) {
						if (!this.isValidTree(element)) continue;
						if (filter(element)) return element;

						queue.push(element);
					}
				} else {
					const walk = walkable === null ? Object.keys(curr) : walkable;

					for (const key of walk) {
						if (!Object.prototype.hasOwnProperty.apply(curr, [key])) continue;
						if (ignore.includes(key)) continue;

						const obj = curr[key];

						if (!this.isValidTree(obj)) continue;
						if (filter(obj)) return obj;

						queue.push(obj);
					}
				}
			}

			return null;
		};

		goFileUpload (file) {
			var path = file.path;
			var name = file.name;
			var size = file.size;
			
			this.uploadButtonsDisabled = true;
			this.reloadPopup();

			BDFDB.NotificationUtils.toast("Uploading...", {type:"success"});
			
			try {
				this.uploadPercentageElementPreText = `Looking for server...`;
				this.uploadProcessElementPreText = "";
				this.uploadNameElementPreText = `${name}`;
				
				this.reloadPopup();
			} catch {}
			
			BDFDB.LibraryRequires.request({
				method: "GET",
				url: "https://apiv2.gofile.io/getServer"
			}, (error, response, result) => {
				try {
					if (!error && response && response.statusCode == 200) {
					
						result = JSON.parse(result);
						
						var progress = 0;
						
						let server = result.data.server;

						var fileStream = BDFDB.LibraryRequires.fs.createReadStream(path);
											
						var req = BDFDB.LibraryRequires.request({
							method: "POST",
							url: `https://${server}.gofile.io/uploadFile`,
							formData: {
								'file': {
									'value': fileStream,
									'options': {
										'filename': path,
										'contentType': null
									}
								}
							}
						}, (error, response, result) => {
							try {
								if (!error && response && response.statusCode == 200) {
									result = JSON.parse(result);

									let code = result.data.code;
									let uploadLink = `https://gofile.io/d/${code}`;

									try {
										const textarea = document.getElementsByClassName(BDFDB.disCN.textarea)[0];
										const slateEditor = this.findInTree(textarea.__reactInternalInstance$, e => e && e.insertText, {walkable: ["return", "stateNode", "editorRef"]});
										
										if (textarea.querySelectorAll('[data-slate-string=true]').length > 0) {
											slateEditor.insertText(`\n`);
										}
										slateEditor.insertText(uploadLink);
									}
									catch(e) {
										BDFDB.NotificationUtils.toast(`Failed to insert "${uploadLink}" to textarea. (errno 5) `, {type:"error"});
										console.log(e);
									}
									
									try {
										this.copyToClipboard(uploadLink);
										BDFDB.NotificationUtils.toast(`"${uploadLink}" Has been copied to the clipboard`, {type:"success"});
									} catch { }
									
									try {
										this.uploadPercentageElementPreText = "";
										this.uploadProcessElementPreText = "";
										this.uploadNameElementPreText = "";
										
										this.reloadPopup();
									} catch {}
									
									this.uploadButtonsDisabled = false;
									this.reloadPopup();
									return;
									 
								}
								else {
									BDFDB.NotificationUtils.toast(`Failed to upload file to GoFile. (errno 2 | sc ${ response ? response.statusCode : "none" })`, {type:"error"});
									this.uploadButtonsDisabled = false;
									this.reloadPopup();
									return;
								}
							} catch(e) {
								console.log(e);
								BDFDB.NotificationUtils.toast("Failed to upload file to GoFile. (errno 4)", {type:"error"});
								this.uploadButtonsDisabled = false;
								this.reloadPopup();
								return;
							}
						});
						
						fileStream.on('data', function(chunk){
							try {
								progress += chunk.length;
								let uploadPercentage = parseInt((progress/req.headers['content-length'])*100);
								console.log('percent complete: '+uploadPercentage+'%\n');
								
								window.noUploadLimitThis.uploadPercentageElementPreText = `Uploading file ${uploadPercentage}%`;
								window.noUploadLimitThis.uploadProcessElementPreText = `${(Math.round(progress/1000000 * 100) / 100).toFixed(2)}/${(Math.round(req.headers['content-length']/1000000 * 100) / 100).toFixed(2)} MB`;
									
								window.noUploadLimitThis.reloadPopup();
								
							} catch {}
						});
						
						fileStream.on('end', function(){
							try {
								window.noUploadLimitThis.uploadPercentageElementPreText = `Uploading file...`;
								window.noUploadLimitThis.uploadProcessElementPreText = ``;

								window.noUploadLimitThis.reloadPopup();

							} catch {}
						});
						
					} else {
						BDFDB.NotificationUtils.toast("Failed to upload file to GoFile. (errno 1)", {type:"error"});
						this.uploadButtonsDisabled = false;
						this.reloadPopup();
						return;
					}
				} catch(e) {
					console.log(e);
					BDFDB.NotificationUtils.toast("Failed to upload file to GoFile. (errno 3)", {type:"error"});
					this.uploadButtonsDisabled = false;
					this.reloadPopup();
					return;
				}
			});
		}
	
		imgurUpload (file) {
			var path = file.path;
			var name = file.name;
			var size = file.size;
			
			BDFDB.NotificationUtils.toast("Uploading...", {type:"success"});
			
			this.uploadButtonsDisabled = true;
			this.reloadPopup();

			try {
				
				this.uploadPercentageElementPreText = `Uploading image...`;
				this.uploadProcessElementPreText = "";
				this.uploadNameElementPreText = `${name}`;

				this.reloadPopup();

			} catch {}
			

			try {
				var progress = 0;
				var fileStream = BDFDB.LibraryRequires.fs.createReadStream(path);
									
				var req = BDFDB.LibraryRequires.request({
					method: "POST",
					url: `https://api.imgur.com/3/image?client_id=546c25a59c58ad7`,
					formData: {
						'image': {
							'value': fileStream,
							'options': {
								'filename': path,
								'contentType': null
							}
						}
					}
				}, (error, response, result) => {
					try {
						if (!error && response && response.statusCode == 200) {
							result = JSON.parse(result);
							
							let uploadLink = result.data.link;
							
							try {
								const textarea = document.getElementsByClassName(BDFDB.disCN.textarea)[0];
								const slateEditor = this.findInTree(textarea.__reactInternalInstance$, e => e && e.insertText, {walkable: ["return", "stateNode", "editorRef"]});
								
								if (textarea.querySelectorAll('[data-slate-string=true]').length > 0) {
									slateEditor.insertText(`\n`);
								}
								slateEditor.insertText(uploadLink);
							}
							catch(e) {
								BDFDB.NotificationUtils.toast(`Failed to insert "${uploadLink}" to textarea. (errno 5) `, {type:"error"});
								console.log(e);
							}
							
							try {
								this.copyToClipboard(uploadLink);
								BDFDB.NotificationUtils.toast(`"${uploadLink}" Has been copied to the clipboard`, {type:"success"});
							} catch { }
							
							try {
								this.uploadPercentageElementPreText = "";
								this.uploadProcessElementPreText = "";
								this.uploadNameElementPreText = "";
								
								this.reloadPopup();
								
							} catch {}
							
							this.uploadButtonsDisabled = false;
							this.reloadPopup();
							return;
							 
						}
						else {
							BDFDB.NotificationUtils.toast(`Failed to upload image to Imgur. (errno 1 | sc ${ response ? response.statusCode : "none" })`, {type:"error"});
							this.uploadButtonsDisabled = false;
							this.reloadPopup();
							return;
						}
					} catch(e) {
						console.log(e);
						BDFDB.NotificationUtils.toast("Failed to upload image to Imgur. (errno 3)", {type:"error"});
						this.uploadButtonsDisabled = false;
						this.reloadPopup();
						return;
					}
				});
				
				fileStream.on('data', function(chunk){
					try {
						progress += chunk.length;
						let uploadPercentage = parseInt((progress/req.headers['content-length'])*100);
						console.log('percent complete: '+uploadPercentage+'%\n');
						
							
						window.noUploadLimitThis.uploadPercentageElementPreText = `Uploading image ${uploadPercentage}%`;
						window.noUploadLimitThis.uploadProcessElementPreText =  `${(Math.round(progress/1000000 * 100) / 100).toFixed(2)}/${(Math.round(req.headers['content-length']/1000000 * 100) / 100).toFixed(2)} MB`;
							
						window.noUploadLimitThis.reloadPopup();
						
					} catch {}
				});
				
				fileStream.on('end', function(){
					try {
						window.noUploadLimitThis.uploadPercentageElementPreText = `Uploading image...`;
						window.noUploadLimitThis.uploadProcessElementPreText = ``;
						
						window.noUploadLimitThis.reloadPopup();
					
					} catch {}
				});
			} catch(e) {
				console.log(e);
				BDFDB.NotificationUtils.toast("Failed to upload file to Imgur. (errno 2)", {type:"error"});
				this.uploadButtonsDisabled = false;
				this.reloadPopup();
				return;
			}
		}
		
		streamableUpload (file) {
			var path = file.path;
			var name = file.name;
			var size = file.size;

			BDFDB.NotificationUtils.toast("Uploading...", {type:"success"});
			
			this.uploadButtonsDisabled = true;
			this.reloadPopup();

			try {
				
				this.uploadPercentageElementPreText = `Uploading video...`;
				this.uploadProcessElementPreText = "";
				this.uploadNameElementPreText = `${name}`;

				this.reloadPopup();

			} catch {}
			

			try {
				var progress = 0;
				var fileStream = BDFDB.LibraryRequires.fs.createReadStream(path);
									
				var auth = btoa(videos.streamableUsername + ":" + videos.streamablePass);
				
				var req = BDFDB.LibraryRequires.request({
					method: "POST",
					url: `https://api.streamable.com/upload`,
					'headers': {
							'Authorization': `Basic ${auth}`
					},
					formData: {
						'file': {
							'value': fileStream,
							'options': {
								'filename': path,
								'contentType': null
							}
						}
					}
				}, (error, response, result) => {
					try {
						if (!error && response && response.statusCode == 200) {
							result = JSON.parse(result);
							
							let code = result.shortcode;
							let uploadLink = `https://streamable.com/${code}`;
							
							try {
								const textarea = document.getElementsByClassName(BDFDB.disCN.textarea)[0];
								const slateEditor = this.findInTree(textarea.__reactInternalInstance$, e => e && e.insertText, {walkable: ["return", "stateNode", "editorRef"]});
				
								if (textarea.querySelectorAll('[data-slate-string=true]').length > 0) {
									slateEditor.insertText(`\n`);
								}
								slateEditor.insertText(uploadLink);
							}
							catch(e) {
								BDFDB.NotificationUtils.toast(`Failed to insert "${uploadLink}" to textarea. (errno 5) `, {type:"error"});
								console.log(e);
							}
							
							try {
								this.copyToClipboard(uploadLink);
								BDFDB.NotificationUtils.toast(`"${uploadLink}" Has been copied to the clipboard`, {type:"success"});
							} catch { }
							
							try {
								this.uploadPercentageElementPreText = "";
								this.uploadProcessElementPreText = "";
								this.uploadNameElementPreText = "";
								
								this.reloadPopup();
								
							} catch {}
							
							this.uploadButtonsDisabled = false;
							this.reloadPopup();
							return;
							 
						}
						else if (!error && response && response.statusCode == 401) {
							BdApi.alert("Authorization failed for Streamable", "The Streamable account in the plugin's settings is wrong.\n\nMake sure you entered all the details correctly.");
							this.uploadButtonsDisabled = false;
							this.reloadPopup();
							return;
						}
						else {
							BDFDB.NotificationUtils.toast(`Failed to upload image to Streamable. (errno 1 | sc ${ response ? response.statusCode : "none" })`, {type:"error"});
							this.uploadButtonsDisabled = false;
							this.reloadPopup();
							return;
						}
					} catch(e) {
						console.log(e);
						BDFDB.NotificationUtils.toast("Failed to upload image to Streamable. (errno 3)", {type:"error"});
						this.uploadButtonsDisabled = false;
						this.reloadPopup();
						return;
					}
				});
				
				fileStream.on('data', function(chunk){
					try {
						progress += chunk.length;
						let uploadPercentage = parseInt((progress/req.headers['content-length'])*100);
						console.log('percent complete: '+uploadPercentage+'%\n');
						
							
						window.noUploadLimitThis.uploadPercentageElementPreText = `Uploading video ${uploadPercentage}%`;
						window.noUploadLimitThis.uploadProcessElementPreText =  `${(Math.round(progress/1000000 * 100) / 100).toFixed(2)}/${(Math.round(req.headers['content-length']/1000000 * 100) / 100).toFixed(2)} MB`;
							
						window.noUploadLimitThis.reloadPopup();
						
					} catch {}
				});
				
				fileStream.on('end', function(){
					try {
						window.noUploadLimitThis.uploadPercentageElementPreText = `Uploading video...`;
						window.noUploadLimitThis.uploadProcessElementPreText = ``;
						
						window.noUploadLimitThis.reloadPopup();
					
					} catch {}
				});
			} catch(e) {
				console.log(e);
				BDFDB.NotificationUtils.toast("Failed to upload file to Streamable. (errno 2)", {type:"error"});
				this.uploadButtonsDisabled = false;
				this.reloadPopup();
				return;
			}
		}
	
		processChannelTextAreaContainer (e) {
			this.uploadsButton = BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.PopoutContainer, {
				children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ChannelTextAreaButton, {
					key: "upload-button",
					nativeClass: true,
					iconSVG: uploadIconPath
				}),
				padding: 10,
				animation: BDFDB.LibraryComponents.PopoutContainer.Animation.SCALE,
				position: BDFDB.LibraryComponents.PopoutContainer.Positions.TOP,
				align: BDFDB.LibraryComponents.PopoutContainer.Align.RIGHT,
				onClose: instance => {
					let channelTextareaButtonIns = BDFDB.ReactUtils.findOwner(instance, {key: "upload-button"});
					if (channelTextareaButtonIns) {
						channelTextareaButtonIns.props.isActive = false;
						BDFDB.ReactUtils.forceUpdate(channelTextareaButtonIns);
					}
					this.uploadPopupOpened = true;
				},
				renderPopout: instance => {
					if (!this.uploadButtonsDisabled && !switches.advancedButtons && this.uploadPopupOpened && new Date().getTime()-1000 > this.uploadLastTime.getTime()) {
						this.uploadAutoSelector.click();
						this.uploadLastTime = new Date();
						this.uploadPopupOpened = false;
					}
					
					let channelTextareaButtonIns = BDFDB.ReactUtils.findOwner(instance, {key: "upload-button"});
					if (channelTextareaButtonIns) {
						channelTextareaButtonIns.props.isActive = true;
						BDFDB.ReactUtils.forceUpdate(channelTextareaButtonIns);
					}
					let popoutelements = [];
					popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
						className: BDFDB.disCN.marginbottom8,
						children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsLabel, {
							label: `Upload a file (Maximum ${amounts.uploadLimit} MB)`
						})
					}));
					popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
						className: BDFDB.disCN.marginbottom8
					}));
					
					popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
						className: BDFDB.disCN.marginbottom8,
						children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsLabel, {
							key: "upload-percentage",
							label: this.uploadPercentageElementPreText
						})
					}));

					popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
						className: BDFDB.disCN.marginbottom8,
						children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsLabel, {
							key: "upload-progress",
							label: this.uploadProcessElementPreText
						})
					}));
					
					popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
						className: BDFDB.disCN.marginbottom8,
						children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsLabel, {
							key: "upload-name",
							label: this.uploadNameElementPreText
						})
					}));
					popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
						className: BDFDB.disCN.marginbottom8
					}));
					if (switches.advancedButtons) {
						popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
							children: "File",
							grow: 1,
							key: "button-file",
							disabled: this.uploadButtonsDisabled,
							onClick: value => {
								this.uploadFileSelector.click();
							}
						}));
						popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.MessageDivider , {
							className: BDFDB.disCN.marginbottom8
						}));
						popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
							children: "Image",
							grow: 1,
							key: "button-image",
							disabled: this.uploadButtonsDisabled,
							onClick: value => {
								this.uploadImageSelector.click();
							}
						}));
						popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.MessageDivider , {
							className: BDFDB.disCN.marginbottom8
						}));
						popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
							children: "Video",
							grow: 1,
							key: "button-video",
							disabled: this.uploadButtonsDisabled,
							onClick: value => {
								var is_auth = false;
								try {
									is_auth = (videos.streamableUsername && videos.streamablePass);
								} catch {}
								if (is_auth) {
									this.uploadVideoSelector.click();
								} else {
									BdApi.alert("No account for Streamable", "No account for Streamable was found.\n\nPlease create and enter an account in the plugin's settings.");
								}
							}
						}));
					} else {
						
						popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
							children: "File / Image / Video",
							grow: 1,
							key: "button-auto",
							disabled: this.uploadButtonsDisabled,
							onClick: value => {
								
								this.uploadAutoSelector.click()
							}
						}));

					}
					popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.MessageDivider , {
						className: BDFDB.disCN.marginbottom8
					}));					
					popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
						children: "Restart",
						grow: 1,
						style: {"background-color": "#FF0000"},
						key: "button-restart",
						disabled: this.uploadButtonsDisabled,
						onClick: value => {
							BdApi.Plugins.reload(this.name)
						}
					}));
					
					this.uploadPopup = instance;
					
					return popoutelements;
				}
			})
			
			let [children, index] = BDFDB.ReactUtils.findParent(e.returnvalue, {name: "ChannelEditorContainer"});
			if (index > -1 && children[index].props.type == BDFDB.DiscordConstants.TextareaTypes.NORMAL && !children[index].props.disabled) {
				let [children2, index2] = BDFDB.ReactUtils.findParent(e.returnvalue, {props:[["className", BDFDB.disCN.textareapickerbuttons]]});
				if (index2 > -1 && children2[index2].props && children2[index2].props.children) children2[index2].props.children.unshift(this.uploadsButton);
			}
		}
		
		copyToClipboard(text) {
			var input = document.body.appendChild(document.createElement("input"));
			input.value = text;
			input.focus();
			input.select();
			document.execCommand('copy');
			input.parentNode.removeChild(input);
		}

	}
})();

module.exports = NoUploadLimit;
