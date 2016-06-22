(function(µ,SMOD,GMOD,HMOD,SC){
	
	SC=SC({
		gIn:"getInputValues",
		rs:"request",
		dialog:"ui.Dialog"
	});
	
	var storageForm=document.getElementById("storageForm");
	var storageFormMessage=document.getElementById("storageFormMessage");
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
			updateList();
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
	var updateList=function()
	{
		SC.rs.json("rest/storage/list").then(function(storages)
		{
			storageList.innerHTML=storages.map(storage=>{
				var backups=Object.keys(storage.backups).map(b=>String.raw`
					<td class="backupName">${b}</td>
					<td class="backupPath">${storage.backups[b]}</td>
				`);
				return String.raw`
<tr data-storage-id="${storage.ID}">
	<td  rowspan="${backups.length}" class="name">${storage.name}</td>
	<td  rowspan="${backups.length}" class="path">${storage.path}</td>
	${backups[0]||String.raw`<td></td><td></td>`}
	<td  rowspan="${backups.length}" class="actions">
		<button data-action="addBackup">add Backup</button>
		<button data-action="doBackup">do backup</button>
	</td>
</tr>
${backups.slice(1).map(s=>String.raw`<tr>${s}</tr>`).join("\n")}`
			}).join("");
		});
	};
	
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
						data.id=parseInt(data.id,10);
						SC.rs({
							url:"rest/storage/addBackup",
							contentType:"application/json",
							data:JSON.stringify(data)
						}).then(function()
						{
							dialog.remove();
							updateList();
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
						id:backupTask.id,
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
						SC.rs({
							url:"rest/backup/confirm",
							data:dataString
						}).catch(param=>SC.dialog(param.response));
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
				param=>SC.dialog(param.response));
				break;
			default:
				µ.logger.error(`unknown action ${action} from ${id}`);
		}
	};
	
	updateList();
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);