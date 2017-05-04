/*
COPYRIGHT 2017 - LOREN HOWARD
*/

(function() {
  var strType = 2;

  var GRID_SIZE = 300,
      PRECISION = 1,

      KP_MAP = [
        [0,0],[1,0],[2,0],
        [0,1],[1,1],[2,1],
        [0,2],[1,2],[2,2],
      ],

      RE_1 = /^([A-Za-z])(\d{1,2})(?:\-[Kk][Pp]?(\d)(?:\-(\d))?)?$/,
      RE_2 = /^([A-Za-z])(\d{1,2})(?:[Kk][Pp]?(\d)(\d)?)?$/,
      RE_3 = /^([A-Za-z])(\d{1,2})(?:\s+(\d)(\d)?)?$/,
      RE_4 = /^([A-Za-z])(\d{1,2})(?:\s+(\d)(?:\s+(\d))?)?$/,

      EX1 = 'A1-KP1-1',
      EX2 = 'A1K11',
      EX3 = 'A1 1 1',
      EX4 = 'A1 11'
  ;

  var strs = function(str, re) {
    return str.match(re).slice(1);
   };

  function pos(str) {
    var re;

    switch(strType) {
      case 1:
        re = RE_1;
        break;
      case 2:
        re = RE_2;
        break;
      case 3:
        re = RE_3;
        break;
       case 4:
        re = RE_4;
        break;
    }
    
    var posStrs = strs(str, re);
    
    var isKp = true,
        isKps = true
    ;
    
    if (posStrs[3] === undefined) {
      isKps = false;
      if (posStrs[2] === undefined) {
        isKp = false;
      }
    }
    
    var gridXCoord = parseInt(posStrs[0],36)-10,
        gridYCoord = parseInt(posStrs[1])-1,
        kpCoord = parseInt(posStrs[2])-1,
        kpsCoord = parseInt(posStrs[3])-1
     ;
    
    var kpXComponent = isKp ? (KP_MAP[kpCoord][0])/3 : 0,
        kpYComponent = isKp ? (KP_MAP[kpCoord][1])/3 : 0,
        kpsXComponent = isKps ? (KP_MAP[kpsCoord][0])/9 : 0,
        kpsYComponent = isKps ? (KP_MAP[kpsCoord][1])/9 : 0
    ;
        
    var gridX = gridXCoord + kpXComponent + kpsXComponent,
        gridY = gridYCoord + kpYComponent + kpsYComponent
    ;

    var err = 0;
    
    if (!isKp && !isKps) {
      err = 1;
    } else if (!isKps) {
      err = (1/3);
    } else {
      err = (1/9);
    }

    

    return [gridX*GRID_SIZE, gridY*GRID_SIZE, err*GRID_SIZE];
  }

  function dist(str1, str2) {
    var pos1 = pos(str1);
    var pos2 = pos(str2);
    
    var x1 = pos1[0],
        y1 = pos1[1],
        e1 = pos1[2],
        x2 = pos2[0],
        y2 = pos2[1],
        e2 = pos2[2]
    ;
    
    return [
      Math.hypot(x2-x1, y2-y1),
      Math.hypot(e1, e2)
    ];
  }

  var i1el = document.getElementById('i1'),
      i2el = document.getElementById('i2'),
      sel = document.getElementById('type'),
      oel = document.getElementById('output')
  ;

  var update = function() {
    try {
      var v1 = i1el.value,
           v2 = i2el.value
      ;
      
      var distErr = dist(v1,v2),
          distStr = distErr[0].toFixed(PRECISION),
          errStr = '(+/- ' + distErr[1].toFixed(PRECISION) + ')'
      ;
      
      oel.textContent =  distStr + ' ' + errStr + ' meters';
    } catch(_) {
      oel.textContent = '\u00A0';
    }
  };

  var ilistener = function(e) {
    update();
  };

  var updateph = function() {
    var ph;
    
    switch(strType) {
      case 1:
        ph = EX1;
        break;
      case 2:
        ph = EX2;
        break;
      case 3:
        ph = EX3;
        break;
       case 4:
        ph = EX4;
        break;
    }
    
    i1el.setAttribute('placeholder', 'Position 1 (ex: \'' + ph + '\')');
    i2el.setAttribute('placeholder', 'Position 2 (ex: \'' + ph + '\')');
  };

  var slistener = function(e) {
    strType = parseInt(sel.value);
    updateph();
    update();
  };

  i1el.addEventListener('input', ilistener);
  i2el.addEventListener('input', ilistener);
  sel.addEventListener('change', slistener);

  updateph();
})();
