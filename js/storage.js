(function(µ,SMOD,GMOD,HMOD,SC){
	
	SC=SC({
		gIn:"getInputValues",
		rs:"request"
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
			storageList.innerHTML=storages.map(storage=>
			String.raw`<tr data-storage-id="${storage.name}">
				<td class="name">${storage.name}</td>
				<td class="path">${storage.path}</td>
				<td class="backups">${storage.backups.map(b=>String.raw`<div>${b}</div>`).join("\n")}</td>
				<td class="actions">
					<button data-action="addBackup">add Backup</button>
					<button data-action="doBackup">do backup</button>
				</td>
			</tr>`).join("\n");
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
	
	var backupForm=document.getElementById("backupForm");
	var backupFormMessage=document.getElementById("backupFormMessage");
	var backupFormName=document.querySelector("#backupForm [name=name]");
	var doAction=function(action,id)
	{
		switch(action)
		{
			case "addBackup":
			
				backupForm.dataset.hidden=false;
				backupFormName.value=id;
				break;
			case "doBackup":
				SC.rs.json({
					url:"rest/storage/doBackup",
					data:JSON.stringify({name:id})
				})
				.then(function(backupTask)
				{
					var dialog=document.createElement("div");
					dialog.classList.add("dialog");
					dialog.innerHTML=String.raw`
						<table>
							<thead>
								<tr>
									<th>name</th>
									<th>added</th>
									<th>changed</th>
									<th>removed</th>
								</tr>
							</thead>
							<tbody>
								${backupTask.changes.map(entry=>String.raw`
								<tr>
									<td>${entry.name}</td>
									<td>
										${entry.changes.created.map(f=>String.raw`
										<div>${f}</div>
										`).join("")}
									</td>
									<td>
										${entry.changes.changed.map(f=>String.raw`
										<div>${f}</div>
										`).join("")}
									</td>
									<td>
										${entry.changes.deleted.map(f=>String.raw`
										<div>${f}</div>
										`).join("")}
									</td>
								</tr>
								`).join("")}
							</tbody>
						</table>
					`;
					document.body.appendChild(dialog);
				},//TODO
				µ.logger.error);
				break;
			default:
				µ.logger.error(`unknown action ${action} from ${id}`);
		}
	};
	
	backupForm.addEventListener("submit",function(event)
	{
		backupFormMessage.textContent="";
		SC.rs({
			url:"rest/storage/addBackup",
			contentType:"application/json",
			data:JSON.stringify(SC.gIn(backupForm.querySelectorAll("input"),null,true))
		}).then(function()
		{
			backupForm.dataset.hidden=true;
			backupForm.reset();
			updateList();
		},function(error)
		{
			backupFormMessage.textContent=error.response;
		});
		event.preventDefault();
		return false;
	});
	backupForm.addEventListener("reset",function(event)
	{
		backupFormMessage.textContent="";
	});
	backupForm.querySelector("[type=reset]").addEventListener("click",function()
	{
		backupForm.dataset.hidden=true;
	});
	
	updateList();
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);