(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		gIn:"getInputValues",
		rs:"request",
		dialog:"ui.Dialog",
		tree:"gui.tree",
		stree:"gui.selectionTree"
	});

	var storageForm=document.getElementById("storageForm");
	var storageFormMessage=document.getElementById("storageFormMessage");

	var searchInput=document.getElementById("searchInput");
	var treeContainer=document.getElementById("treeContainer");

	storageForm.addEventListener("submit",function(event)
	{
		storageFormMessage.textContent="";
		SC.rs({
			url:"rest/storage/add",
			contentType:"application/json",
			data:JSON.stringify(SC.gIn(storageForm.querySelectorAll("input"),null,true))
		}).then(function()
		{
			storageForm.reset();
			updateStorages();
		},function(error)
		{
			storageFormMessage.textContent=error.response;
		});
		event.preventDefault();
		return false;
	});
	storageForm.addEventListener("reset",function()
	{
		storageFormMessage.textContent="";
	});

	var storageList=document.getElementById("storageList");
	var updateStorages=function()
	{
		document.body.classList.add("blocked");
		SC.rs.json("rest/storage/list").then(function(storages)
		{
			storages.sort((a,b)=>a.name.toLowerCase()>b.name.toLowerCase());
			//manager
			storageList.innerHTML=storages.map(storage=>{
				var backups=Object.keys(storage.backups).map(b=>String.raw`
					<td class="backupName">${b}</td>
					<td class="backupPath">${storage.backups[b]}</td>
				`);
				return String.raw`
<tr data-storage-id="${storage.name}">
	<td  ${backups.length?'rowspan="'+backups.length+'"':''} class="name">${storage.name}</td>
	<td  ${backups.length?'rowspan="'+backups.length+'"':''} class="path">${storage.path}</td>
	${backups[0]||String.raw`<td></td><td></td>`}
	<td  ${backups.length?'rowspan="'+backups.length+'"':''} class="actions">
		<button data-action="addBackup">add Backup</button>
		<button data-action="doBackup">do backup</button>
	</td>
</tr>
${backups.slice(1).map(s=>String.raw`<tr>${s}</tr>`).join("\n")}`
			}).join("");

			//browser
			while (treeContainer.firstChild) treeContainer.firstChild.remove();
			for(var storage of storages) storage.structure.name=storage.name;
			storages.map(s=>treeContainer.appendChild(SC.stree(s.structure,function(element,node)
			{
				element.classList.add("fileItem");
				element.classList.add(node.isFile?"file":"folder");
				element.innerHTML=String.raw`<span class="name">${node.name}</span><span class="size">${formatSize(node.size)}</span>`;
			})));

		})
		.then(()=>document.body.classList.remove("blocked"));
	};
	var formatSize=function(size)
	{
		var levels=["","k","M","G","T","E","Z","Y"];
		for(var i=0;i<levels.length&&size>1000;i++,size/=1000);
		return size.toFixed(2)+" "+levels[i]+"B";
	}

	storageList.addEventListener("click",function(event)
	{
		if(event.target.dataset.action)
		{
			var item=event.target;
			while(!("storageId" in item.dataset))item=item.parentNode;
			doAction(event.target.dataset.action,item.dataset.storageId);
		}
	});

	var doAction=function(action,id)
	{
		switch(action)
		{
			case "addBackup":
				var backupForm;
				var dialog=SC.dialog(String.raw
`
<form>
		<input type="hidden" name="id" value="${id}">
		<label><span>Name</span><input type="text" name="name" required></label>
		<label><span>Path</span><input type="text" name="path" required></label>
		<div id="backupFormMessage"></div>
</form>
`				,
				[
					function Ok()
					{
						backupFormMessage.textContent="";
						var data=SC.gIn(backupForm,null,true);
						SC.rs({
							url:"rest/storage/addBackup",
							contentType:"application/json",
							data:JSON.stringify(data)
						}).then(function()
						{
							dialog.remove();
							updateStorages();
						},function(error)
						{
							backupFormMessage.textContent=error.response;
						});
					},
					function Cancel(dialog)
					{
						dialog.remove();
					}
				]);
				backupForm=dialog.querySelector("form");
				break;
			case "doBackup":
				SC.rs.json({
					url:"rest/backup/request",
					data:JSON.stringify({id:id})
				})
				.then(function(backupTask)
				{
					var dataString=JSON.stringify({
						id:id,
						token:backupTask.token
					});
					var dialog=SC.dialog(String.raw`
<table class="backupTable">
	<thead>
		<tr>
			<th>name</th>
			<th>add</th>
			<th>change</th>
			<th>remove</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>${backupTask.changes.storageName}</td>
			<td>
				${backupTask.changes.storage.created.map(f=>String.raw
				`<div>${f}</div>
				`).join("")}
			</td>
			<td>
				${backupTask.changes.storage.changed.map(f=>String.raw
				`<div>${f}</div>
				`).join("")}
			</td>
			<td>
				${backupTask.changes.storage.deleted.map(f=>String.raw
				`<div>${f}</div>
				`).join("")}
			</td>
		</tr>
		${Object.keys(backupTask.changes.backupChanges).map(name=>String.raw`
		<tr>
			<td>${name}</td>
			<td>
				${backupTask.changes.backupChanges[name].created.map(f=>String.raw
				`<div>${f}</div>
				`).join("")}
			</td>
			<td>
				${backupTask.changes.backupChanges[name].changed.map(f=>String.raw
				`<div>${f}</div>
				`).join("")}
			</td>
			<td>
				${backupTask.changes.backupChanges[name].deleted.map(f=>String.raw
				`<div>${f}</div>
				`).join("")}
			</td>
		</tr>
		`).join("")}
	</tbody>
</table>
`					,
					[function Ok (dialog)
					{
						SC.rs.json({
							url:"rest/backup/confirm",
							data:dataString
						}).catch(param=>param.response)
						.then(backupResponse);
						dialog.remove();
					},
					function Cancel (dialog)
					{
						SC.rs({
							url:"rest/backup/cancel",
							data:dataString
						});
						dialog.remove();
					}]);
				},
				param=>backupResponse(param.response));
				break;
			default:
				µ.logger.error(`unknown action ${action} from ${id}`);
		}
	};

	var backupResponse=function(response)
	{
		µ.logger.info(response);
		if(!(response instanceof String)) response=JSON.stringify(response,null,"\t");
		var responseDialog=SC.dialog(response);
		responseDialog.classList.add("backupResponse");
	}

	searchInput.addEventListener("change",function()
	{
		var filterFn
		if(searchInput.value)
		{
			var term=new RegExp(searchInput.value.trim().split("\s+").join(".*"),"i");
			filterFn=node=>term.test(node.name);
		}
		for(var tree of treeContainer.children)
		{
			tree.filter(filterFn);
			tree.expand(!!filterFn,true);
		}
	})

	SC.rs.json("rest/storage/warnings").then(warnings=>
	{
		if(Object.keys(warnings).length>0) alert("Warning!\n"+JSON.stringify(warnings,null,"\t"));
		updateStorages();
	});

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
