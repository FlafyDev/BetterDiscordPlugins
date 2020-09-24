//META{"name":"NoUploadLimit","authorId":"143031299152674816","donate":"https://twitter.com/FlafyDev","website":"http://flafy.herokuapp.com/","source":"https://raw.githubusercontent.com/FlafyDev/BetterDiscordPlugins/master/Plugins/NoUploadLimit/NoUploadLimit.plugin.js"}*//

 module.exports = (_ => {
    const config = {
		"info": {
			"name": "NoUploadLimit",
			"author": "Flafy",
			"version": "0.1.4",
			"description": "Several alternative ways to upload files, images and videos through discord."
		},
		"changeLog": {
			"fixed": {
				"Quick Action": "Fixed plugin not working due to the BDFDB update."
			}
		}
	};
    return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return config.info.description;}
		
        load() {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue:[]});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
							if (!e && b && b.indexOf(`//META{"name":"`) > -1) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => {});
							else BdApi.alert("Error", "Could not download BDFDB library plugin, try again some time later.");
						});
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(config.info.name)) window.BDFDB_Global.pluginQueue.push(config.info.name);
        }
        start() {}
        stop() {}
    } : (([Plugin, BDFDB]) => {
		
		var videos = {}, amounts = {}, switches = {}
  
		const uploadIconPath = `
			<svg aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
			  <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M16.293 9.293L17.707 10.707L12 16.414L6.29297 10.707L7.70697 9.293L11 12.586V2H13V12.586L16.293 9.293ZM18" transform="scale(1.2, -1.2) translate(-2, -17)"/>
			  
			  <path fill="currentColor" fill-rule="evenodd"  clip-rule="evenodd" d="M0 .586L16.293 9.293ZM18 20V18H20V20C20 21.102 19.104 22 18 22H6C4.896 22 4 21.102 4 20V18H6V20H18Z" transform="scale(1.2, 1.2) translate(0, -)"/>
			</svg>
		`
		
		let uploadPopupOpened,
			uploadPopup,
			uploadLastTime,
			uploadPercentageElementPreText,
			uploadProcessElementPreText,
			uploadNameElementPreText,
			uploadButtonsDisabled,
			lastFilesDropped,
			uploadsButton,
			uploadVideoSelector,
			uploadVideoAllowedExtensions ,
			uploadVideoSelectorFunction,
			uploadImageSelector,
			uploadImageAllowedExtensions,
			uploadImageSelectorFunction,
			uploadFileSelector,
			uploadFileSelectorFunction ,
			uploadAutoSelector,
			uploadAutoSelectorFunction,
			reloadPopup,
			uploadPromptToUploadPatch,
			uploadErrorPatch
		
		return class NoUploadLimit extends Plugin {
			onLoad() {
				var streamableLink = BDFDB.ReactUtils.createElement("a", {
					className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._repolink, "Login to Streamable (Required for videos)"),
					href: "https://streamable.com/signup",
					children: "Login to Streamable (Required for videos)",
					rel: "noreferrer noopener",
					target: "_blank"
				})
							
				this.patchedModules = {
					before: {
						ChannelTextAreaForm: "render",
						ChannelEditorContainer: "render",
						Embed: "render"
					},
					after: {
						ChannelTextAreaContainer: "render",
						Messages: "type",
						MessageContent: "type",
						Embed: "render"
					}
				};
				
				this.defaults = {
					amounts: {
						uploadLimit:			{value:100, min:8, max:1500, title:"Upload limit (MB)"}
					},
					switches: {
						advancedButtons:		{value:false, title:"Show a seperate button for files, images and videos"}
					},
					videos: {
						streamableUsername: 	{value:"",	description:"Email or username", title: streamableLink, style: {}},
						streamablePass:			{value:"", 	description:"Password", title:" ", style: {"-webkit-text-security": "disc"}}
					}
				};
			}
			
			onStart() {
				// Reload again when starting discord.
				var an_element_exists = document.getElementById("NULon")
				if (an_element_exists == undefined) {
					var an_element = document.createElement("div");
					an_element.id = "NULon"
					document.head.appendChild(an_element)
					setTimeout( _ => {
						BdApi.Plugins.reload(this.getName());
					}, 1000)
					return;
				} 
					
				uploadPopupOpened = true;
				uploadLastTime = new Date();
				uploadPopup = null;
				uploadPercentageElementPreText = "";
				uploadProcessElementPreText = "";
				uploadNameElementPreText = "";
				uploadButtonsDisabled = false;
				lastFilesDropped = undefined;
				uploadsButton = null;
				
				// Video
				uploadVideoSelector = document.createElement('input');
				uploadVideoSelector.type = 'file';
				uploadVideoSelector.accept = ".mp4,.mov,.mpeg4,.avi\.wmv,.mpegps,.flv,.webm"
				uploadVideoAllowedExtensions = /(\.mp4|\.mov|\.mpeg4|\.avi\.wmv|\.mpegps|\.flv|\.webm)$/i; 
				uploadVideoSelectorFunction = function (file) {
					var is_auth = false;
					
					try {
						is_auth = (videos.streamableUsername.length && videos.streamablePass.length);
					} catch {}
					
					if (is_auth) {
						if (file.size > amounts.uploadLimit * 1000000) {
							BdApi.alert("Reached upload limit", `Max file size is ${amounts.uploadLimit} MB.\n\nThe limit can be changed in the plugins's settings.`);
						} else {
							this.streamableUpload(file);
						}
					} else {
						BdApi.alert("No account for Streamable", "No account for Streamable was found.\n\nPlease create and enter an account in the plugin's settings.");
					}
				}
				uploadVideoSelector.onchange = e => { 
					var file = e.target.files[0];
					if (uploadButtonsDisabled == false) {
						if (uploadVideoAllowedExtensions.exec(file.name)) {
							uploadVideoSelectorFunction.call(this, file)
						} else {
							BdApi.alert("Invalid image file type", "Images must be any of the following types:\n\n.mp4\n\n.mov\n\n.mpeg4\n\n.avi\n\n.wmv\n\n.mpegps\n\n.flv\n\n.webm");
						}
					} else {
						BdApi.alert("Can't upload multiple files at once", 'The plugin "No Upload Limit" cannot upload multiple files at once.\n\nTo cancel the current upload restart discord with CTRL+R.');
					}
					
					e.target.value = null;
				}
				
				// Image
				uploadImageSelector = document.createElement('input');
				uploadImageSelector.type = 'file';
				uploadImageSelector.accept = ".jpeg,.jpg,.png,.gif";
				uploadImageAllowedExtensions = /(\.jpeg|\.jpg|\.png|\.gif)$/i;
				uploadImageSelectorFunction = function (file) {
					if (file.size > amounts.uploadLimit * 1000000) {
						BdApi.alert("Reached upload limit", `Max file size is ${amounts.uploadLimit} MB.\n\nThe limit can be changed in the plugins's settings.`);
					} else {
						imgurUpload(file);
					}
				}
				uploadImageSelector.onchange = e => { 
					var file = e.target.files[0];

					if (uploadButtonsDisabled == false) {
						if (uploadImageAllowedExtensions.exec(file.name)) {
							uploadImageSelectorFunction.call(this, file)
						} else {
							BdApi.alert("Invalid image file type", "Images must be any of the following types:\n\n.jpeg\n\n.jpg\n\n.png\n\n.gif");
						}
					} else {
						BdApi.alert("Can't upload multiple files at once", 'The plugin "No Upload Limit" cannot upload multiple files at once.\n\nTo cancel the current upload restart discord with CTRL+R.');
					}
					
					e.target.value = null;
				}

				// File
				uploadFileSelector = document.createElement('input');
				uploadFileSelector.type = 'file';
				uploadFileSelectorFunction = function (file) {
					if (file.size > amounts.uploadLimit * 1000000) {
						BdApi.alert("Reached upload limit", `Max file size is ${amounts.uploadLimit} MB.\n\nThe limit can be changed in the plugins's settings.`);
					} else {
						this.goFileUpload(file);
					}
				}
				uploadFileSelector.onchange = e => { 
					var file = e.target.files[0];
					
					if (uploadButtonsDisabled == false) {
						uploadFileSelectorFunction.call(this, file);
					} else {
						BdApi.alert("Can't upload multiple files at once", 'The plugin "No Upload Limit" cannot upload multiple files at once.\n\nTo cancel the current upload restart discord with CTRL+R.');
					}
					
					e.target.value = null;
				}

				// Auto
				uploadAutoSelector = document.createElement('input');
				uploadAutoSelector.type = 'file';
				uploadAutoSelectorFunction = function (file) {
					if (uploadButtonsDisabled == false) {
						if (uploadVideoAllowedExtensions.exec(file.name)) {
							uploadVideoSelectorFunction.call(this, file);
						} else if (uploadImageAllowedExtensions.exec(file.name)) {
							uploadImageSelectorFunction.call(this, file);
						} else {
							uploadFileSelectorFunction.call(this, file);
						}
					} else {
						BdApi.alert("Can't upload multiple files at once", 'The plugin "No Upload Limit" cannot upload multiple files at once.\n\nTo cancel the current upload restart discord with CTRL+R.');
					}
				}
				uploadAutoSelector.onchange = e => { 
					var file = e.target.files[0];
					
					uploadAutoSelectorFunction.call(this, file);
					
					e.target.value = null;
				}
				
				reloadPopup = function() {
					if (uploadButtonsDisabled == false) {
						uploadPercentageElementPreText = "";
						uploadProcessElementPreText = "";
						uploadNameElementPreText = "";
					}
					try {
						var buttonAuto = BDFDB.ReactUtils.findOwner(uploadPopup, {key: "button-auto"})
						buttonAuto.props.disabled = uploadButtonsDisabled;
					} catch {}
					
					try {
						var buttonFile = BDFDB.ReactUtils.findOwner(uploadPopup, {key: "button-file"})
						buttonFile.props.disabled = uploadButtonsDisabled;
					} catch {}
					
					try {
						var buttonImage = BDFDB.ReactUtils.findOwner(uploadPopup, {key: "button-image"})
						buttonImage.props.disabled = uploadButtonsDisabled;
					} catch {}
					
					try {
						var buttonVideo = BDFDB.ReactUtils.findOwner(uploadPopup, {key: "button-video"})
						buttonVideo.props.disabled = uploadButtonsDisabled;
					} catch {}	
					
					try {
						var uploadPercentageElement = BDFDB.ReactUtils.findOwner(uploadPopup, {key: "upload-percentage"})
						uploadPercentageElement.props.label = uploadPercentageElementPreText;
					} catch {}	
					
					try {
						var uploadProgressElement = BDFDB.ReactUtils.findOwner(uploadPopup, {key: "upload-progress"})
						uploadProgressElement.props.label = uploadProcessElementPreText;
					} catch {}
					
					try {
						var uploadNameElement = BDFDB.ReactUtils.findOwner(uploadPopup, {key: "upload-name"})
						uploadNameElement.props.label = uploadNameElementPreText;
					} catch {}
					
					BDFDB.ReactUtils.forceUpdate(uploadPopup);
					
				}
				
				let uploadArea = document.getElementsByClassName(BdApi.findModuleByProps('uploadArea').uploadArea)[0]
			
				uploadPromptToUploadPatch = BdApi.monkeyPatch(uploadArea.__reactInternalInstance$.return.stateNode, "promptToUpload", {
					before: (e) => {
						var files = e.methodArguments[0]
						if (files[1] == undefined) {
							lastFilesDropped = files[0]
						} else {
							lastFilesDropped = "multi";
						}
					}
				});
				
				uploadErrorPatch = BdApi.monkeyPatch(BdApi.findModule(m => m.displayName === 'UploadError').prototype, 'render', {
					instead: (e) => {
						try {
							if (lastFilesDropped != undefined) {
								var file = lastFilesDropped;
								lastFilesDropped = undefined;
								uploadAutoSelectorFunction.call(this, file);
							} else if (lastFilesDropped === "multi") {
								BdApi.alert("Can't upload multiple files at once", 'The plugin "No Upload Limit" cannot upload multiple files at once.\n\nTo cancel the current upload restart discord with CTRL+R.');
							}
						} catch (e) {
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
				
				this.forceUpdateAll()
			}
			
			onStop() {
				if (uploadErrorPatch) {
					uploadErrorPatch();
				}
				if (uploadPromptToUploadPatch) {
					uploadPromptToUploadPatch();
				}
				
				this.forceUpdateAll();
			}
			
			getSettingsPanel () {
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
		
				amounts.uploadLimit = Math.min(Math.max(amounts.uploadLimit, 8), 1500);
				BDFDB.DataUtils.save(amounts, this, "amounts");
				
				BDFDB.PatchUtils.forceAllUpdates(this);
			}
			
			onSettingsClosed () {
				if (this.SettingsUpdated) {
					delete this.SettingsUpdated;
					this.forceUpdateAll();
				}
			}
		
			processChannelTextAreaContainer (e) {
				let [children, index] = BDFDB.ReactUtils.findParent(e.returnvalue, {name: "ChannelEditorContainer"});
				if (index > -1 && children[index].props.type == BDFDB.DiscordConstants.TextareaTypes.NORMAL && !children[index].props.disabled) {
					let [children2, index2] = BDFDB.ReactUtils.findParent(e.returnvalue, {props:[["className", BDFDB.disCN.textareapickerbuttons]]});
					if (index2 > -1 && children2[index2].props && children2[index2].props.children) {
						uploadsButton = BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.PopoutContainer, {
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
								uploadPopupOpened = true;
							},
							renderPopout: instance => {
								if (!uploadButtonsDisabled && !switches.advancedButtons && uploadPopupOpened && new Date().getTime()-1000 > uploadLastTime.getTime()) {
									uploadAutoSelector.click();
									uploadLastTime = new Date();
									uploadPopupOpened = false;
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
										label: uploadPercentageElementPreText
									})
								}));

								popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
									className: BDFDB.disCN.marginbottom8,
									children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsLabel, {
										key: "upload-progress",
										label: uploadProcessElementPreText
									})
								}));
								
								popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
									className: BDFDB.disCN.marginbottom8,
									children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsLabel, {
										key: "upload-name",
										label: uploadNameElementPreText
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
										disabled: uploadButtonsDisabled,
										onClick: value => {
											uploadFileSelector.click();
										}
									}));
									popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.MessageDivider , {
										className: BDFDB.disCN.marginbottom8
									}));
									popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
										children: "Image",
										grow: 1,
										key: "button-image",
										disabled: uploadButtonsDisabled,
										onClick: value => {
											uploadImageSelector.click();
										}
									}));
									popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.MessageDivider , {
										className: BDFDB.disCN.marginbottom8
									}));
									popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
										children: "Video",
										grow: 1,
										key: "button-video",
										disabled: uploadButtonsDisabled,
										onClick: value => {
											uploadVideoSelector.click();
										}
									}));
								} else {
									
									popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
										children: "File / Image / Video",
										grow: 1,
										key: "button-auto",
										disabled: uploadButtonsDisabled,
										onClick: value => {
											
											uploadAutoSelector.click()
										}
									}));

								}
								popoutelements.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.MessageDivider , {
									className: BDFDB.disCN.marginbottom8
								}));
								
								uploadPopup = instance;
								
								return popoutelements;
							}
						})
						children2[index2].props.children.unshift(uploadsButton);
					}
				}
			}
		
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
				
				uploadButtonsDisabled = true;
				reloadPopup();

				BDFDB.NotificationUtils.toast("Uploading...", {type:"success"});
				
				try {
					uploadPercentageElementPreText = `Looking for server...`;
					uploadProcessElementPreText = "";
					uploadNameElementPreText = `${name}`;
					
					reloadPopup();
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
											let textarea = document.getElementsByClassName(BDFDB.disCN.textarea)[0];
											let slateEditor = this.findInTree(textarea.__reactInternalInstance$, e => e && e.insertText, {walkable: ["return", "stateNode", "editorRef"]});
											
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
											copyToClipboard(uploadLink);
											BDFDB.NotificationUtils.toast(`"${uploadLink}" Has been copied to the clipboard`, {type:"success"});
										} catch { }
										
										try {
											uploadPercentageElementPreText = "";
											uploadProcessElementPreText = "";
											uploadNameElementPreText = "";
											
											reloadPopup();
										} catch {}
										
										uploadButtonsDisabled = false;
										reloadPopup();
										return;
										 
									}
									else {
										BDFDB.NotificationUtils.toast(`Failed to upload file to GoFile. (errno 2 | sc ${ response ? response.statusCode : "none" })`, {type:"error"});
										uploadButtonsDisabled = false;
										reloadPopup();
										return;
									}
								} catch(e) {
									console.log(e);
									BDFDB.NotificationUtils.toast("Failed to upload file to GoFile. (errno 4)", {type:"error"});
									uploadButtonsDisabled = false;
									reloadPopup();
									return;
								}
							});
							
							fileStream.on('data', function(chunk){
								try {
									progress += chunk.length;
									let uploadPercentage = parseInt((progress/req.headers['content-length'])*100);
									// console.log('percent complete: '+uploadPercentage+'%\n');
									
									uploadPercentageElementPreText = `Uploading file ${uploadPercentage}%`;
									uploadProcessElementPreText = `${(Math.round(progress/1000000 * 100) / 100).toFixed(2)}/${(Math.round(req.headers['content-length']/1000000 * 100) / 100).toFixed(2)} MB`;
										
									reloadPopup();
									
								} catch {}
							});
							
							fileStream.on('end', function(){
								try {
									uploadPercentageElementPreText = `Uploading file...`;
									uploadProcessElementPreText = ``;

									reloadPopup();

								} catch {}
							});
							
						} else {
							BDFDB.NotificationUtils.toast("Failed to upload file to GoFile. (errno 1)", {type:"error"});
							uploadButtonsDisabled = false;
							reloadPopup();
							return;
						}
					} catch(e) {
						console.log(e);
						BDFDB.NotificationUtils.toast("Failed to upload file to GoFile. (errno 3)", {type:"error"});
						uploadButtonsDisabled = false;
						reloadPopup();
						return;
					}
				});
			}
	
			imgurUpload (file) {
				var path = file.path;
				var name = file.name;
				var size = file.size;
				
				BDFDB.NotificationUtils.toast("Uploading...", {type:"success"});
				
				uploadButtonsDisabled = true;
				reloadPopup();

				try {
					
					uploadPercentageElementPreText = `Uploading image...`;
					uploadProcessElementPreText = "";
					uploadNameElementPreText = `${name}`;

					reloadPopup();

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
									let textarea = document.getElementsByClassName(BDFDB.disCN.textarea)[0];
									let slateEditor = this.findInTree(textarea.__reactInternalInstance$, e => e && e.insertText, {walkable: ["return", "stateNode", "editorRef"]});
									
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
									copyToClipboard(uploadLink);
									BDFDB.NotificationUtils.toast(`"${uploadLink}" Has been copied to the clipboard`, {type:"success"});
								} catch { }
								
								try {
									uploadPercentageElementPreText = "";
									uploadProcessElementPreText = "";
									uploadNameElementPreText = "";
									
									reloadPopup();
									
								} catch {}
								
								uploadButtonsDisabled = false;
								reloadPopup();
								return;
								 
							}
							else {
								BDFDB.NotificationUtils.toast(`Failed to upload image to Imgur. (errno 1 | sc ${ response ? response.statusCode : "none" })`, {type:"error"});
								uploadButtonsDisabled = false;
								reloadPopup();
								return;
							}
						} catch(e) {
							console.log(e);
							BDFDB.NotificationUtils.toast("Failed to upload image to Imgur. (errno 3)", {type:"error"});
							uploadButtonsDisabled = false;
							reloadPopup();
							return;
						}
					});
					
					fileStream.on('data', function(chunk){
						try {
							progress += chunk.length;
							let uploadPercentage = parseInt((progress/req.headers['content-length'])*100);
							// console.log('percent complete: '+uploadPercentage+'%\n');
							
								
							uploadPercentageElementPreText = `Uploading image ${uploadPercentage}%`;
							uploadProcessElementPreText =  `${(Math.round(progress/1000000 * 100) / 100).toFixed(2)}/${(Math.round(req.headers['content-length']/1000000 * 100) / 100).toFixed(2)} MB`;
								
							reloadPopup();
							
						} catch {}
					});
					
					fileStream.on('end', function(){
						try {
							uploadPercentageElementPreText = `Uploading image...`;
							uploadProcessElementPreText = ``;
							
							reloadPopup();
						
						} catch {}
					});
				} catch(e) {
					console.log(e);
					BDFDB.NotificationUtils.toast("Failed to upload file to Imgur. (errno 2)", {type:"error"});
					uploadButtonsDisabled = false;
					reloadPopup();
					return;
				}
			}
		
			streamableUpload (file) {
				var path = file.path;
				var name = file.name;
				var size = file.size;

				BDFDB.NotificationUtils.toast("Uploading...", {type:"success"});
				
				uploadButtonsDisabled = true;
				reloadPopup();

				try {
					
					uploadPercentageElementPreText = `Uploading video...`;
					uploadProcessElementPreText = "";
					uploadNameElementPreText = `${name}`;

					reloadPopup();

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
									uploadPercentageElementPreText = "";
									uploadProcessElementPreText = "";
									uploadNameElementPreText = "";
									
									reloadPopup();
									
								} catch {}
								
								uploadButtonsDisabled = false;
								reloadPopup();
								return;
								 
							}
							else if (!error && response && response.statusCode == 401) {
								BdApi.alert("Authorization failed for Streamable", "The Streamable account in the plugin's settings is wrong.\n\nMake sure you entered all the details correctly.");
								uploadButtonsDisabled = false;
								reloadPopup();
								return;
							}
							else {
								BDFDB.NotificationUtils.toast(`Failed to upload image to Streamable. (errno 1 | sc ${ response ? response.statusCode : "none" })`, {type:"error"});
								uploadButtonsDisabled = false;
								reloadPopup();
								return;
							}
						} catch(e) {
							console.log(e);
							BDFDB.NotificationUtils.toast("Failed to upload image to Streamable. (errno 3)", {type:"error"});
							uploadButtonsDisabled = false;
							reloadPopup();
							return;
						}
					});
					
					fileStream.on('data', function(chunk){
						try {
							progress += chunk.length;
							let uploadPercentage = parseInt((progress/req.headers['content-length'])*100);
							console.log('percent complete: '+uploadPercentage+'%\n');
							
								
							uploadPercentageElementPreText = `Uploading video ${uploadPercentage}%`;
							uploadProcessElementPreText =  `${(Math.round(progress/1000000 * 100) / 100).toFixed(2)}/${(Math.round(req.headers['content-length']/1000000 * 100) / 100).toFixed(2)} MB`;
								
							reloadPopup();
							
						} catch {}
					});
					
					fileStream.on('end', function(){
						try {
							uploadPercentageElementPreText = `Uploading video...`;
							uploadProcessElementPreText = ``;
							
							reloadPopup();
						
						} catch {}
					});
				} catch(e) {
					console.log(e);
					BDFDB.NotificationUtils.toast("Failed to upload file to Streamable. (errno 2)", {type:"error"});
					uploadButtonsDisabled = false;
					reloadPopup();
					return;
				}
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();
