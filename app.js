/*
COPYRIGHT 2017 - LOREN HOWARD
*/

//(function() {
  var strType = 2;

  var GRID_SIZE = 300,
      MAX_DIST = 1350,
      MAX_MIL = 1600,
      PRECISION = 1,

      KP_MAP = [
        [0,0],[1,0],[2,0],
        [0,1],[1,1],[2,1],
        [0,2],[1,2],[2,2],
      ],

      RE_1 = /^([A-Za-z])([1-9]|1[0-9])(?:\-[Kk][Pp]?(\d)(?:\-(\d))?)?$/,
      RE_2 = /^([A-Za-z])([1-9]|1[0-9])(?:[Kk][Pp]?(\d)(\d)?)?$/,
      RE_3 = /^([A-Za-z])([1-9]|1[0-9])(?:\s+(\d)(\d)?)?$/,
      RE_4 = /^([A-Za-z])([1-9]|1[0-9])(?:\s+(\d)(?:\s+(\d))?)?$/,

      C = [
        1611.342362585303,
        -0.780011423446922,
        0.0036687139521660583,
        -0.000016450984941129843,
        3.7604744170742065e-8,
        -4.596546039859563e-11,
        2.847194494843758e-14,
        -7.04244419393223e-18
      ],

      DR = 180/Math.PI,

      EX1 = 'A1-KP1-1',
      EX2 = 'A1K11',
      EX3 = 'A1 1 1',
      EX4 = 'A1 11'
  ;

  var milradian = function(d) {
    return (
      C.map(function(c,i) {
        return c*Math.pow(d,i);
      })
      .reduce(function(a,c) {
        return a+c;
      })
    );
  };

  var heading = function(p1,p2) {
    return (Math.atan2(p2[1]-p1[1], p2[0]-p1[0]) * DR + 450) % 360;
  };

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

  function dist(pos1, pos2) {
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

  var minMaxStr = function(m0,m1) {
    m0 = m0 > 0 ? m0 : 0;
    return '(min: ' + m0 + ', max: ' + m1 + ')';
  };

  var update = function() {
    try {
      var v1 = i1el.value,
          v2 = i2el.value
      ;
     
      var pos1 = pos(v1),
          pos2 = pos(v2)
      ;

      var distErr = dist(pos1,pos2),
          distance = distErr[0],
          err = distErr[1],
          distStr = distance.toFixed(PRECISION),
          dist0 = distance-err,
          dist1 = distance+err,
          dist0s = dist0.toFixed(PRECISION),
          dist1s = dist1.toFixed(PRECISION),
          milrad0 = parseInt(milradian(dist1)),
          milrad = parseInt(milradian(distance)),
          milrad1 = parseInt(milradian(dist0)),
          headA = parseInt(heading([pos1[0],pos1[1]-err],[pos2[0]+err,pos2[1]])),
          head = parseInt(heading(pos1, pos2)),
          headB = parseInt(heading([pos1[0]+err,pos1[1]],[pos2[0],pos2[1]-err])),
          head0,head1
      ;


      //if (head>=180) {
        head0=headA;
        head1=headB;
      //} else {
      //  head0=headB;
      //  head1=headA;
      //}

      var ms;
      if (distance < MAX_DIST && milrad > 0) {
        milrad1 = milrad1 < MAX_MIL ? milrad1 : MAX_MIL;
        milrad = milrad < MAX_MIL ? milrad : MAX_MIL;
        ms = milrad + '</strong> <span>' + minMaxStr(milrad0,milrad1) + '</span>';
      } else {
        ms = 'Out of Range</strong>';
      }
      
      var line1 = 'Distance: <strong>' + distStr + 'm</strong> <span>' + minMaxStr(dist0s,dist1s) + '</span>',
          line2 = 'Milliradian: <strong>' + ms,
          line3 = 'Bearing: <strong>' + head + ' degrees</strong>'// <span>' + minMaxStr(head0,head1) + '</span>'
      ;

      oel.innerHTML = line1 + '<br>' + line2 + '<br>' + line3;
    } catch(_) {
      oel.innerHTML = '&nbsp;<br>&nbsp;<br>&nbsp;';
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
//})();
