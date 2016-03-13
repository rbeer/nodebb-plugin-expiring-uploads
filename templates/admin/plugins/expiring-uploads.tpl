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

<script type="text/javascript">
'use strict';
/* globals app, socket config */
$(document).ready(function() {
  // Expiration Time
  var expDays = document.getElementById('expDays');
  var expWeeks = document.getElementById('expWeeks');
  var expMonths = document.getElementById('expMonths');
  var chkCustomTstamp = document.getElementById('chkCustomTstamp');
  var expTstamp = document.getElementById('expTstamp');
  // Storage Path & Delete Files
  var storagePath = document.getElementById('storagePath');
  var chkDelFiles = document.getElementById('chkDelFiles');
  // Expiring Filetypes
  var lstFiletypes = document.getElementById('lstFiletypes');
  var btnAddFiletype = document.getElementById('btnAddFiletype');
  var txtFiletype = document.getElementById('txtFiletype');
  // Link Text
  var chkLinkText = document.getElementById('chkLinkText');
  var linkText = document.getElementById('linkText');
  // Save Settings
  var btnSave = document.getElementById('btnSave');

  // Jedi Math Tricks <|:)
  expDays.addEventListener('change', calcExpiration);
  expWeeks.addEventListener('change', calcExpiration);
  expMonths.addEventListener('change', calcExpiration);
  expTstamp.addEventListener('blur', validateExpiration);
  chkCustomTstamp.addEventListener('click', function handleUseModKey() {
    expTstamp.disabled = !this.checked;
    expDays.disabled = expWeeks.disabled =
    expMonths.disabled = this.checked;
  });

  storagePath.addEventListener('blur', function() {
    if (this.value.substr(-1) !== '/') {
      this.value = this.value + '/';
    }
  });

  btnAddFiletype.addEventListener('click', function() {
    addFiletypes(txtFiletype.value);
    txtFiletype.value = '';
  });
  lstFiletypes.addEventListener('dblclick', function() {
    this.options.remove(this.selectedIndex);
  });

  chkLinkText.addEventListener('click', function() {
    linkText.disabled = !this.checked;
  });

  btnSave.addEventListener('click', function(e) {
    var ftypes = '';
    for (var i = 0; i < lstFiletypes.options.length; i++) {
      ftypes = ftypes + lstFiletypes.options[i].value + ',';
    }
    ftypes = ftypes.substring(0, ftypes.length - 1);
    $.post(config.relative_path + '/api/admin/plugins/expiring-uploads/save', {
      _csrf: config.csrf_token,
      storage: storagePath.value,
      expireAfter: expTstamp.value,
      customTstamp: chkCustomTstamp.checked,
      hiddenTypes: ftypes,
      delFiles: chkDelFiles.checked,
      linkText: linkText.value,
      setLinkText: chkLinkText.checked
    }, function(data) {
      if (data === 'OK') {
        app.alert({
          type: 'success',
          alert_id: 'expiring-uploads-saved',
          title: 'Settings Saved',
          message: 'Please reload your NodeBB to apply these settings',
          clickfn: function() {
            socket.emit('admin.reload');
          }
        });
      } else {
        app.alertError('Error while saving settings: ' + data);
      }
    });
    e.preventDefault();
  });

  function addFiletypes(types) {
    var listhas = false;
    if (types === '') {
      return app.alertError('Please add at least one filetype! ' +
                            '(e.g. .zip, rar,.html)');
    }
    types = types.split(',');
    for (var i = 0; i < types.length; i++) {
      types[i] = types[i].trim();
      if (types[i].substring(0, 1) !== '.') {
        types[i] = '.' + types[i];
      }
      listhas = false;
      for (var j = 0; j < lstFiletypes.options.length; j++) {
        if (lstFiletypes.options[j].value === types[i]) {
          listhas = true;
          break;
        }
      }
      if (!listhas) {
        lstFiletypes.add(new Option(types[i]));
      }
    }
  }

  function calcExpiration() {
    // 1 month resolves to the Gregorian calendar's
    // mean month length of 30.44 days (precise: 30.436875 days)
    expTstamp.value = (parseInt(expDays.value, 10) * 86400) +
                      (parseInt(expWeeks.value, 10) * 604800) +
                      (parseInt(expMonths.value, 10) * 2629743);
  };
  function validateExpiration() {
    if (this.value === '') {
      app.alert({
        type: 'warning',
        alert_id: 'expiring-uploads-tstamp-invalid',
        title: 'Invalid value',
        message: 'Please enter numbers in the custom timestamp field, only!',
        clickfn: function() {
          expTstamp.focus();
        }
      });
      this.value = this.defaultValue;
    } else {
      splitExpiration(parseInt(this.value, 10));
    }
  };
  function splitExpiration(totalVal) {
    var monthVal = Math.floor(totalVal / 2629743);
    var weekVal = Math.floor((totalVal - (2629743 * monthVal)) / 604800);
    var dayVal = Math.floor((totalVal - (2629743 * monthVal) -
                            (604800 * weekVal)) / 86400);
    expMonths.value = (monthVal <= 12) ? monthVal : 13;
    expWeeks.value = (weekVal <= 3) ? weekVal : 0;
    expDays.value = (dayVal <= 6) ? dayVal : 0;
  };
  // called immediately
  splitExpiration(parseInt(expTstamp.value, 10));
});

</script>
