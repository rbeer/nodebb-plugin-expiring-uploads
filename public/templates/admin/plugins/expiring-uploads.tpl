<div class="row">
  <div class="col-lg-8">
    <div class="panel panel-default">
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
              <select class="form-control" id="expDays"<!-- IF customTstamp --> disabled<!-- ENDIF customTstamp -->>
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
              <select class="form-control" id="expWeeks"<!-- IF customTstamp --> disabled<!-- ENDIF customTstamp -->>
                <option value="0">---</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
              </select>
              <span class="input-group-addon">
                <label for="expMonths">Months</label>
              </span>
              <select class="form-control" id="expMonths"<!-- IF customTstamp --> disabled<!-- ENDIF customTstamp -->>
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
                  <input type="checkbox" id="chkCustomTstamp"<!-- IF customTstamp --> checked<!-- ENDIF customTstamp -->>
                  Custom
                </label>
              </div>
              <input type="number" class="form-control" id="expTstamp" value="{expTstamp}" min="0"<!-- IF !customTstamp --> disabled<!-- ENDIF !customTstamp -->/>
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
              <input type="checkbox" class="form-control" id="chkDelFiles"<!-- IF delFiles --> checked<!-- ENDIF delFiles -->>
              Delete Files when they are expired.
            </label>
          </div>
          <div class="form-group">
            <label for="fileTypeAdd">Expiring Filetypes</label><br />
            <p>Filename extensions of uploads to expire.</p>
            <div class="row">
              <div class="col-lg-5">
                <div class="input-group">
                  <input type="text" id="txtFiletype" class="form-control" placeholder=".zip">
                  <span class="input-group-btn">
                    <button type="button" id="btnAddFiletype" class="btn btn-default">Add >></button>
                  </span>
                </div>
              </div>
              <div class="col-lg-7">
                <select id="lstFiletypes" class="form-control" multiple>
                  <!-- BEGIN hiddenTypes -->
                  <option>{hiddenTypes.ftype}</option>
                  <!-- END hiddenTypes -->
                </select>
                <small>Double click list entries to delete!</small>
              </div>
            </div>
          </div>
          <div class="form-group">
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
  </div>
</div>

<script type="text/javascript" src="{relative_path}/plugins/nodebb-plugin-expiring-uploads/scripts/admin/settings.js"></script>
<script defer>require(['expiring-uploads.settings'], (settings) => console.log(settings));
</script>
