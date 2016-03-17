<style type="text/css" media="screen">
#tblUploads td {
  overflow-wrap: break-word;
  max-width: 50px;
}
#tblHeader {
  padding-bottom: 0;
  padding-right: 30px;
}
#tblUploads tr:not(.expiredFile) .fa-check {
  color: #4CAF50;
}
#tblUploads tr:not(.expiredFile) .fa-times {
  color: #FF5722;
}
#tblUploads tr:not(.expiredFile) .fa-minus {
  color: #FF5722;
}
#tblUploads .fa-times {
  cursor: pointer;
}
th {
  text-align: center;
}
.iconDelete {
  text-align: center;
}
.iconFS {
  text-align: center;
}
.textExpiration {
  text-align: center;
  text-align-last: right;
}
.centerMultiline {
  text-align: center;
}
.expiredFile {
  color: #CCC;
}
.expiredFile:hover {
  color: #666;
}
.expiredFile:hover .fa-times {
  color: #FF5722;
}
.expiredFile:hover .fa-check {
  color: #4CAF50;
}
.expiredFile:hover .fa-minus {
  color: #FF5722;
}
  
</style>
<div class="row">
  <div class="col-lg-8">
    <ul class="nav nav-tabs" role="tablist">
      <li role="presentation">
        <a href="#settings" aria-controls="settings" role="tab" data-toggle="tab">Settings</a>
      </li>
      <li role="presentation" class="active">
        <a href="#uploads"  aria-controls="uploads" role="tab" data-toggle="tab">Uploads</a>
      </li>
    </ul>
    <div class="panel panel-default">
      <div class="tab-content">
        <div role="tabpanel" class="tab-pane fade" id="settings">
          <div class="panel-heading">Settings</div>
          <div class="panel-body">
            <form>
              <div class="form-group">
              <label>Expiration Time</label><br />
              <p>Pick how long uploads are available.</p>
                <div class="input-group">
                  <span class="input-group-addon">
                    <label for="expDays">Days</label>
                  </span>
                  <select class="form-control" id="expDays">
                    <option value="0">---</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                    <option>6</option>
                  </select>
                  <span class="input-group-addon">
                    <label for="expWeeks">Weeks</label>
                  </span>
                  <select class="form-control" id="expWeeks">
                    <option value="0">---</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                  </select>
                  <span class="input-group-addon">
                    <label for="expMonths">Months</label>
                  </span>
                  <select class="form-control" id="expMonths">
                    <option value="0">---</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                    <option>6</option>
                    <option>7</option>
                    <option>8</option>
                    <option>9</option>
                    <option>10</option>
                    <option>11</option>
                    <option>12</option>
                    <option value="13">++</option>
                  </select>
                </div><br />
                <div class="input-group">
                  <div class="input-group-addon">
                    <label for="chkCustomTstamp" style="margin-bottom: -1px;">
                      <input type="checkbox" id="chkCustomTstamp">
                      Custom
                    </label>
                  </div>
                  <input type="number" class="form-control" id="expTstamp" value="{expTstamp}" min="0"/>
                  <span class="input-group-addon">seconds</span>
                </div>
              </div>
              <div class="form-group">
                <label for="storagePath">Storage</label><br />
                <p>Folder where expiring uploads are stored.</p>
                <div class="input-group">
                  <span class="input-group-addon">{basePath}</span>
                  <input type="text" id="storagePath" class="form-control" value="{storagePath}">
                </div>
                <br />
                <label for="chkDelFiles">
                  <input type="checkbox" id="chkDelFiles"<!-- IF delFiles --> checked<!-- ENDIF delFiles -->>Delete Files when they are expired.
                </label>
              </div>
              <div class="form-group">
                <label for="fileTypeAdd">Expiring Filetypes</label><br />
                <p>Filename extensions of uploads to expire.</p>
                <div class="row">
                  <div class="col-lg-5">
                    <div class="input-group">
                      <input type="text" id="txtFiletype" class="form-control" placeholder="zip rar .txt .tmp">
                      <span class="input-group-btn">
                        <button type="button" id="btnAddFiletype" class="btn btn-default">Add</button>
                      </span>
                    </div>
                  </div>
                  <div class="col-lg-7">
                    <select id="lstFiletypes" class="form-control" multiple>
                      <!-- BEGIN expiringTypes -->
                      <option>{expiringTypes.ftype}</option>
                      <!-- END expiringTypes -->
                    </select>
                    <small>Double click list entries to delete!</small>
                  </div>
                </div>
              </div>
              <div class="form-group hidden">
                <label for="fileTypeAdd">Link Text</label><br />
                <p>Show this text instead of the filename on the link.</p>
                <div class="row">
                  <div class="col-lg-5">
                    <div class="input-group">
                      <div class="input-group-addon">
                        <label style="margin-bottom: -1px;">
                          <input type="checkbox" id="chkLinkText"<!-- IF setLinkText --> checked<!-- ENDIF setLinkText -->>
                        </label>
                      </div>
                      <input type="text" class="form-control" id="linkText" value="{linkText}"<!-- IF !setLinkText --> disabled<!-- ENDIF !setLinkText -->/>
                    </div>
                  </div>
                </div>
              </div>
              <button class="btn btn-primary btn-md" id="btnSave">Save Settings</button>
            </form>
          </div>
        </div>
        <div role="tabpanel" class="tab-pane fade in active" id="uploads">
          <div class="panel-heading">Uploads</div>
          <div id="tblHeader" class="panel-body">
            <table class="table" style="margin-bottom: 0;">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Filename</th>
                  <th>User</th>
                  <th>On Disk</th>
                  <th>Expiration</th>
                  <th></th>
                </tr>
              </thead>
            </table>
          </div>
          <div class="panel-body pre-scrollable">
            <table id="tblUploads" class="table table-hover">
              <tbody>
                <tr>
                  <td>$fname</td>
                  <td>$user</td>
                  <td>$fs</td>
                  <td>$exp</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script type="text/javascript" src="{relative_path}/plugins/nodebb-plugin-expiring-uploads/scripts/admin/main.js"></script>
<script type="text/javascript" src="{relative_path}/plugins/nodebb-plugin-expiring-uploads/scripts/admin/uploads.js"></script>
<script type="text/javascript" src="{relative_path}/plugins/nodebb-plugin-expiring-uploads/scripts/admin/settings.js"></script>
<script type="text/javascript" src="{relative_path}/plugins/nodebb-plugin-expiring-uploads/scripts/admin/settings/filetypes.js"></script>
<script type="text/javascript" src="{relative_path}/plugins/nodebb-plugin-expiring-uploads/scripts/admin/settings/time.js"></script>
<script type="text/javascript" src="{relative_path}/plugins/nodebb-plugin-expiring-uploads/scripts/admin/uielements.js"></script>
<script type="text/javascript" src="{relative_path}/plugins/nodebb-plugin-expiring-uploads/scripts/admin/uihandler.js"></script>
<script type="text/javascript" src="{relative_path}/plugins/nodebb-plugin-expiring-uploads/scripts/admin/uploads/table.js"></script>