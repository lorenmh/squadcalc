/*
COPYRIGHT 2017 - LOREN HOWARD
*/

(function() {
  var strType = 2;

  var GRID_SIZE = 300,
      MAX_DIST = 1350,
      MAX_MIL = 1570,
      PRECISION = 1,

      KP_MAP = [
        [0,2],[1,2],[2,2],
        [0,1],[1,1],[2,1],
        [0,0],[1,0],[2,0],
      ],

      RE_1 = /^([A-Za-z])([1-9])((?:\-(?:[Kk][Pp]?)?[1-9])*)(?:\-(?:[Kk][Pp]?)?)?$/,
      RE_2 = /^([A-Za-z])([1-9])((?:(?:[Kk][Pp]?)?[1-9])*)(?:[Kk][Pp]?)?$/,
      RE_3 = /^([A-Za-z])([1-9])\s+((?:[1-9])*)(?:\s+)?$/,
      RE_4 = /^([A-Za-z])([1-9])((?:\s+[1-9])*)(?:\s+)?$/,

      REPLACE_RE = /[^1-9]/g,

      MIN_ATOM = {},
      MAX_ATOM = {},
      MIN_X = 50,
      MAX_X = 1250,
      MIN_Y = 1579,
      MAX_Y = 800,

      C = [
        [50, 1579],
        [100, 1558],
        [150, 1538],
        [200, 1517],
        [250, 1496],
        [300, 1475],
        [350, 1453],
        [400, 1431],
        [450, 1409],
        [500, 1387],
        [550, 1364],
        [600, 1341],
        [650, 1317],
        [700, 1292],
        [750, 1267],
        [800, 1240],
        [850, 1212],
        [900, 1183],
        [950, 1152],
        [1000, 1118],
        [1050, 1081],
        [1100, 1039],
        [1150, 988],
        [1200, 918],
        [1250, 800]
      ],

      DR = 180/Math.PI,

      EX1 = 'A1-KP1-1',
      EX2 = 'A111',
      EX3 = 'A1 11',
      EX4 = 'A1 1 1'
  ;

  var interpolator = function(d) {
    if (d < MIN_X) {
      return MIN_ATOM;
    } else if (d > MAX_X) {
      return MAX_ATOM;
    }
    var i, c, n, cx, cy, nx, ny, vx, vy, dx;
    for (i=0; i<C.length; i++) {
      c = C[i];
      n = C[i+1];
      cx = c[0];
      cy = c[1];

      if (d === cx) {
        return cy;
      }

      nx = n[0];

      if (nx <= d) { continue; }

      ny = n[1];

      vx = nx-cx;
      vy = ny-cy;

      dx = d-cx;

      return Math.round((vy/vx)*dx+cy);
    }
  };

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
    var x1 = p1[0],
        y1 = p1[1],
        x2 = p2[0],
        y2 = p2[1],
        dx = x2-x1,
        dy = y2-y1,
        m = Math.hypot(dx,dy),
        ux = dx / m,
        uy = dy / m,
        rad = Math.atan2(uy, ux),
        deg = rad * DR
    ;

    if (ux === 0 && uy === 1) { return 180; }

    if (x2>x1 && y2>=y1) {
      return deg+90;
    }
    //w
    if (x2>=x1 && y2<y1) {
      return deg+90;
    }
    //w
    if (x2<x1 && y2>=y1) {
      return deg+90;
    }
    //w
    if (x2<=x1 && y2<y1) {
      return (180-Math.abs(deg))+270;
    }
    //if (x2
  };

  var tl = function(p) {
    return [p[0], p[1]];
  };

  var tr = function(p) {
    return [p[0]+p[2], p[1]];
  };

  var br = function(p) {
    return [p[0]+p[2], p[1]+p[2]];
  };

  var bl = function(p) {
    return [p[0], p[1]+p[2]];
  };


  var bearingwc = function(p1,p2) {
    var dx = p2[0]-p1[0],
        dy = p2[1]-p1[1],
        w // worst
    ;

    // in this case the err > the dx, which means p1 is within p2, vice versa
    if (Math.hypot(p1[2],p1[2]) > Math.hypot(dx,dy) ||
        Math.hypot(p2[2],p2[2]) > Math.hypot(dx,dy)) { return null; }

    var c;
    if (dx===0 && dy<0)       { c=1; w = [[br(p1), bl(p2)], [bl(p1), br(p2)]]; }
    else if (dx>0 && dy<0)    { c=2; w = [[br(p1), tl(p2)], [tl(p1), br(p2)]]; }
    else if (dx>0 && dy===0)  { c=3; w = [[bl(p1), tl(p2)], [tl(p1), bl(p2)]]; }
    else if (dx>0 && dy>0)    { c=4; w = [[bl(p1), tr(p2)], [tr(p1), bl(p2)]]; }
    else if (dx===0 && dy>0)  { c=5; w = [[tl(p1), tr(p2)], [tr(p1), tl(p2)]]; }
    else if (dx<0 && dy>0)    { c=6; w = [[tl(p1), br(p2)], [br(p1), tl(p2)]]; }
    else if (dx<0 && dy===0)  { c=7; w = [[tr(p1), br(p2)], [br(p1), tr(p2)]]; }
    else                      { c=8; w = [[tr(p1), bl(p2)], [bl(p1), tr(p2)]]; }
    //console.log(dx,dy, c, ''+w);

    return [heading(w[0][0], w[0][1]), heading(w[1][0], w[1][1])];
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
    
    var pstrs = strs(str, re),
        gxs = pstrs[0],
        gys = pstrs[1],
        kps = pstrs[2]
    ;
    
    console.log(kps);
    var gx = parseInt(gxs,36)-10,
        gy = parseInt(gys)-1,
        kp = !kps ? [] : (
          kps
            .replace(REPLACE_RE, '')
            .split('')
            .map(function(ks){ return parseInt(ks); })
            .map(function(k){ return [KP_MAP[k-1][0], KP_MAP[k-1][1]]; })
            .map(function(k,i) {
              var e = Math.pow(1/3,i+1);
              return [k[0]*e, k[1]*e];
            })
        )
    ;

    console.log(kp);

    var kpxa, kpya, kpx, kpy;
    if (kp.length) {
      kpxa = kp.map(function(k){ return k[0]; });
      kpya = kp.map(function(k){ return k[1]; });
      kpx = kpxa.reduce(function(a,c){ return a+c; });
      kpy = kpya.reduce(function(a,c){ return a+c; });
    } else {
      kpx = 0;
      kpy = 0;
    }

    
    var px = gx + kpx,
        py = gy + kpy
    ;

    var err = Math.pow((1/3), kp.length);
    console.log(err);
    
    return [px*GRID_SIZE, py*GRID_SIZE, err*GRID_SIZE];
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
    m0 = m0 === MAX_ATOM ? MAX_Y : m0;
    m1 = m1 === MIN_ATOM ? MIN_Y : m1;
    m0 = m0 < 0 ? 0 : m0;

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

          milrad0 = interpolator(dist1),
          milrad = interpolator(distance),
          milrad1 = interpolator(dist0),

          //headA = parseInt(heading([pos1[0],pos1[1]-err],[pos2[0]+err,pos2[1]])),
          head = distance ? parseInt(heading(pos1, pos2)) : 0,
          //headB = parseInt(heading([pos1[0]+err,pos1[1]],[pos2[0],pos2[1]-err])),
          //head0,head1
          berr = bearingwc(pos1, pos2)
      ;

      //if (head>=180) {
        //head0=headA;
        //head1=headB;
      //} else {
      //  head0=headB;
      //  head1=headA;
      //}

      var ms;
      if (milrad !== MIN_ATOM && milrad !== MAX_ATOM) {
        ms = milrad + '</strong> <span>' + minMaxStr(milrad0,milrad1) + '</span>';
      } else {
        if (milrad === MAX_ATOM) {
          ms = 'Out of Range</strong>';
        } else {
          ms = 'Too Close</strong>';
        }
      }

      var bs;
      if (berr) {
        berr[0] = Math.floor(berr[0]) % 360;
        berr[1] = Math.ceil(berr[1]) % 360;

        bs = head + ' degrees</strong> <span>' + minMaxStr(berr[0],berr[1]) + '</span>';
      } else {
        bs = head + ' degrees</strong> (high error)';
      }
      
      var line1 = 'Distance: <strong>' + distStr + 'm</strong> <span>' + minMaxStr(dist0s,dist1s) + '</span>',
          line2 = 'Milliradian: <strong>' + ms,
          line3 = 'Bearing: <strong>' + bs
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
})();
