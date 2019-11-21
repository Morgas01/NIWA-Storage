(function(µ,SMOD,GMOD,HMOD,SC){

	let Dialog=GMOD("gui.Dialog");

	SC=SC({
		rs:"rescope",
		Tree:"gui.Tree",
		fuzzySearch:"fuzzySearch",
		unit:"metricUnit",
		PathMenu:"gui.PathMenu",
		Table:"gui.OrganizedTable",
		TableConfig:"gui.TableConfig.Select",
		register:"register",
		request:"request",
		encase:"encase",
		action:"gui.actionize",
		Organizer:"Organizer",
		Structure:"Structure",
		NodePatch:"NodePatch"
	});

	let StorageBrowser=µ.Class({
		constructor:function(data)
		{
			SC.rs.all(this,["_onTreeDblClick","_onContentDblClick","_onLocateFocus","_onLocateChange"]);

			this.content=document.createElement("div");
			this.content.innerHTML=`
				<div class="locationbar">
					<input type="text" data-action="locate">
					<div data-action="close"></div>
				</div>
				<div class="actions">
					<div data-action="copy">copy</div>
					<div data-action="move">move</div>
					<div data-action="markSelection" accesskey="s">mark selected</div>
					<div data-action="showMarked" accesskey="m" data-selected="0" data-marked="0">marked</div>
				</div>
				<input type="text" data-action="search">
				<div class="storageTree"></div>
				<div class="content"></div>
			`;

			this.data=[];
			this.structureToStorageMap=new WeakMap();

			this.content.classList.add("StorageBrowser");

			this.search=this.content.querySelector("input[data-action='search']");
			let contentWrapper=this.content.querySelector(".content");
			let treeWrapper=this.content.querySelector(".storageTree");
			let locationbar=this.content.querySelector(".locationbar");
			this.locateInput=this.content.querySelector("input[data-action='locate']");

			this.tree=new SC.Tree([],(element,entry)=>
			{
				element.textContent=this.getStructureEntryName(entry);
				element.classList.add("Structure");
				element.parentNode.dataset.type=entry.type;
			});
			treeWrapper.appendChild(this.tree.element);
			this.tree.element.addEventListener("dblclick",this._onTreeDblClick)

			this.pathMenu=new SC.PathMenu([],(e,d)=>e.textContent=this.getStructureEntryName(d),{
				menuParam:{filter:d=>d.type==="Directory"}
			});
			locationbar.appendChild(this.pathMenu.element);
			this.ignorePathChange=false;
			this.pathMenu.addEventListener("pathChange",this,this._onPathSelect);
			this.locateInput.addEventListener("focus",this._onLocateFocus);
			this.locateInput.addEventListener("change",this._onLocateChange);

			let tableConfig=new SC.TableConfig([
				{
					name:"Name",
					styleClass:"name",
					fn:(c,e)=>
					{
						c.textContent=this.getStructureEntryName(e);
						c.dataset.type=c.parentNode.dataset.type=e.type;
					}
				},
				{
					name:"size",
					getter:e=>SC.unit.to(e.size,{base:"B"})
				},
				{
					name:"last modified",
					getter:e=>
					{
						let date=new Date(e.mtime);
						return date.toLocaleString(undefined,{hour:"2-digit",minute:"2-digit",second:"2-digit"})+" "+date.toLocaleString(undefined,{year:"numeric",month:"2-digit",day:"2-digit"});
					}
				}
			],{noInput:true,control:true});
			this.table=new SC.Table(tableConfig);
			contentWrapper.appendChild(this.table.getTable());
			contentWrapper.addEventListener("dblclick",this._onContentDblClick);

			this.showMarkedButton=this.content.querySelector(".showMarked");
			this.markedStructures=new Set();

			SC.action(this.actions, this.content,this,["click","change"]);
		},
		setData(data)
		{
			this.data=SC.encase(data);
			this.structureToStorageMap=new WeakMap();
			this.data.forEach(s=>this.structureToStorageMap.set(s.structure,s));
			let structures=data.map(r=>r.structure);
			this.tree.clear().add(structures);
			this.pathMenu.setData(structures);
			this.pathMenu.setActive(this.pathMenu.getActive());
		},
		async setActive(target)
		{
			let path,storage;

			if(!target)
			{
				this.table.clear();
				this.table.add(this.data.map(r=>r.structure));
				this.ignorePathChange=true;
				this.pathMenu.setActive(null);
				return;
			}
			if(typeof target!=="string")
			{
				storage=this._getStorage(target);
				let parents=[];
				for(let top=target;top;top=top.parent){parents.unshift(top)}
				target=parents.map((s,i)=>
				{
					if(i===0&&storage) return storage.path;
					return s.name;
				}).join("/");
			}
			path=target;

			return SC.request.json({
				url:"rest/getDir",
				data:JSON.stringify({path,storage:storage?storage.name:null})
			}).then(result=>
			{
				if(!result.content)
				{
					alert("directory not found");
					return false;
				}

				let root=null,target=null,rootPath=null,pathSeparator=/[\\/]/,storage;
				if(result.storages.length==1)
				{
					storage=this.data.find(s=>s.name===result.storages[0]);
					if(storage)
				 	{
				 		root=JSON.parse(JSON.stringify(storage.structure));
				 		rootPath=result.path.slice(storage.path.length).split(pathSeparator);
				 		if(rootPath[0]==="") rootPath.shift();
				 		target=root;
				 		for(let i=0;i<rootPath.length;i++)
				 		{
				 			let name=rootPath[i];
				 			let child=target.children.find(c=>c.name===name);
				 			if(!child)
				 			{
				 				child={
				 					type:"Directory",
				 					name,
				 					children:[]
				 				};
				 				target.children.push(child);
				 			}
				 			target=child;
				 		}
				 	}
				}
				if(!root)
				{
					rootPath=result.path.split(pathSeparator);
					root=target={
						type:"Directory",
						name:rootPath.shift(),
						children:[]
					};
					for(let i=0;i<rootPath.length;i++)
					{
						child={
							type:"Directory",
							name:rootPath[i],
							children:[]
						};
						target.children.push(child);
						target=child;
					}
				}
				target.children=result.content;

				root=SC.Structure.fromJSON(root);
				target=SC.NodePatch.traverseTo(root,rootPath,{key:"name"});

				this.table.clear();
				let content=Array.from(target.children);
				content.sort(SC.Organizer.attributeSort(["type","name"]));
				this.table.add(content);

				this.ignorePathChange=true;
				let data=this.data.slice();
				if(storage)
				{
					data.splice(data.indexOf(storage),1);
					this.structureToStorageMap.set(root,storage);
				}
				data.unshift(root);
				this.pathMenu.setData(data);
				this.pathMenu.setActive(target);
				return true;
			})
			.catch(error=>
			{
				µ.logger.error(error);
				alert("an error Occurred:\n"+JSON.stringify(error));
				return false;
			});
		},
		getStructureEntryName(entry)
		{
			let displayName=entry.name;
			if(entry.parent==null)
			{
				let root=this._getStorage(entry);
				if(root) displayName=root.name+" ("+displayName+")";
			}
			return displayName;
		},
		getStructureEntryPath(entry)
		{
			let path=entry.getPath();
			let root=this._getStorage(entry);
			path[0]=root.name+" ("+path[0]+")";
			return path.join("/");
		},
		_onTreeDblClick(event)
		{
			let target=event.target;
			let directory=null;
			while(target&&!(directory=this.tree.change(target))) target=target.parentNode;

			if(directory==null) return ;

			if(directory.type==="File") directory=directory.parent;
			this.setActive(directory);
		},
		_onPathSelect(event)
		{
			if(this.ignorePathChange)
			{
				this.ignorePathChange=false;
				return;
			}
			this.setActive(event.active);
		},
		_onContentDblClick(event)
		{
			let target=event.target;
			let directory=null;
			while(target&&!(directory=this.table.change(target))) target=target.parentNode;

			if(directory!=null&&directory.type==="Directory") this.setActive(directory);
		},
		_getStorage(structure)
		{
			let top=structure;
			while(top.parent) top=top.parent;
			return this.structureToStorageMap.get(top);
		},
		_onLocateFocus()
		{
			let active=this.pathMenu.getActive();
			let storage;
			if(active)
			{
				storage=this._getStorage(active);
			}
			let path=this.pathMenu.getActivePath().map((s,i)=>
			{
				if(i===0&&storage) return storage.path;
				return s.name;
			});
			this.locateInput.value=path.join("/");
		},
		_onLocateChange()
		{
			this.setActive(this.locateInput.value).then(changed=>
			{
				if(!changed) this.locateInput.focus();
				else this.locateInput.blur();
			});
		},
		actions:{
			search(event,input)
			{
				if(input.value)
				{
					let term=input.value.trim();
					let scorers=[SC.fuzzySearch.scoreFunctions.string.words(term.match(/(:?\b[a-z]|[A-Z])[a-z]*/g)||term.split(/\s+/))];
					filterFn=entry=>SC.fuzzySearch.score(entry.name,scorers)>0.3;
					this.tree.filter(filterFn);
					this.tree.expandRoots(true);
				}
				else
				{
					this.tree.expandRoots(false);
					this.tree.filter(null);
				}
			},
			markSelection()
			{
				this.table.getSelected().forEach(this.selectedStructures.add,this.selectedStructures);
				this.showMarkedButton.dataset.count=this.selectedStructures.size;
			},
			showMarked()
			{
				this.selectedStructures.clear();
				this.selectedButton.dataset.count=0;
				this.selectedMenu.innerHTML="";
			},
			copy()
			{
				let target=this.pathMenu.getActive();
				if(target==null) return;

				let data={
					structures:SC.register(1,()=>[]),
					target:target.getPath(),
					targetStorage:this._getStorage(target).name
				};
				this.selectedStructures.forEach(s=>
				{
					data.structures[this._getStorage(s).name].push(s.getPath());
				});
				SC.request({
					url:"rest/actions/copy",
					data:JSON.stringify(data)
				}).then(µ.logger.info,µ.logger.error);
			},
			move()
			{
			}
		}
	});

	SMOD("StorageBrowser",StorageBrowser);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);