const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak
} = require('docx');
const fs = require('fs');

const C = {
  navy:"1E3A5F", blue:"2E75B6", lightBlue:"D6E4F0",
  dark:"1A202C", mid:"4A5568", lightGray:"F5F7FA", white:"FFFFFF",
  green:"166534", lightGreen:"DCFCE7", red:"991B1B", lightRed:"FEE2E2",
  orange:"9A3412", lightOrange:"FFEDD5", purple:"5B21B6", lightPurple:"EDE9FE"
};
const bdr  = (c="CCCCCC") => ({ style:BorderStyle.SINGLE, size:1, color:c });
const bdrs = (c="CCCCCC") => ({ top:bdr(c), bottom:bdr(c), left:bdr(c), right:bdr(c) });
const noBdr  = { style:BorderStyle.NONE, size:0, color:"FFFFFF" };
const noBdrs = { top:noBdr, bottom:noBdr, left:noBdr, right:noBdr };
const cm = { top:80, bottom:80, left:140, right:140 };
const cmW = { top:100, bottom:100, left:160, right:160 };

const run  = (t,o={}) => new TextRun({ text:t, font:"Arial", size:22, color:C.dark, ...o });
const runB = (t,o={}) => new TextRun({ text:t, font:"Arial", size:22, color:C.dark, bold:true, ...o });
const runCode = (t) => new TextRun({ text:t, font:"Courier New", size:20, color:"C7254E" });
const runPath = (t) => new TextRun({ text:t, font:"Courier New", size:19, color:"0EA5E9" });

const h1 = t => new Paragraph({ heading:HeadingLevel.HEADING_1, spacing:{before:560,after:200},
  border:{bottom:{style:BorderStyle.SINGLE,size:6,color:C.blue,space:4}},
  children:[new TextRun({text:t,font:"Arial",size:40,bold:true,color:C.navy})] });
const h2 = t => new Paragraph({ heading:HeadingLevel.HEADING_2, spacing:{before:400,after:160},
  children:[new TextRun({text:t,font:"Arial",size:30,bold:true,color:C.blue})] });
const h3 = t => new Paragraph({ heading:HeadingLevel.HEADING_3, spacing:{before:280,after:120},
  children:[new TextRun({text:t,font:"Arial",size:24,bold:true,color:C.dark})] });
const h4 = t => new Paragraph({ spacing:{before:200,after:80},
  children:[new TextRun({text:t,font:"Arial",size:22,bold:true,color:C.mid,italics:true})] });

const p   = (t,o={}) => new Paragraph({ spacing:{before:80,after:100}, children:[run(t,o)] });
const pb  = (l,r,o={}) => new Paragraph({ spacing:{before:80,after:100}, children:[runB(l),run(r,o)] });
const pc  = (l,r) => new Paragraph({ spacing:{before:80,after:100}, children:[runB(l),new TextRun({text:r,font:"Courier New",size:20,color:"C7254E"})] });
const bl  = (t,lv=0) => new Paragraph({ numbering:{reference:"bullets",level:lv}, spacing:{before:60,after:60}, children:[run(t)] });
const blb = (l,r,lv=0) => new Paragraph({ numbering:{reference:"bullets",level:lv}, spacing:{before:60,after:60}, children:[runB(l),run(r)] });
const blc = (l,r,lv=0) => new Paragraph({ numbering:{reference:"bullets",level:lv}, spacing:{before:60,after:60}, children:[runB(l),runPath(r)] });
const nl  = (t,lv=0) => new Paragraph({ numbering:{reference:"nums",level:lv}, spacing:{before:60,after:60}, children:[run(t)] });
const nlb = (l,r,lv=0) => new Paragraph({ numbering:{reference:"nums",level:lv}, spacing:{before:60,after:60}, children:[runB(l),run(r)] });
const sp  = (b=160) => new Paragraph({ spacing:{before:b,after:0}, children:[run("")] });
const pgBrk = () => new Paragraph({ children:[new PageBreak()] });

const secDiv = (t,fill=C.navy) => new Paragraph({
  spacing:{before:400,after:200},
  shading:{fill,type:ShadingType.CLEAR},
  children:[new TextRun({text:`  ${t}`,font:"Arial",size:30,bold:true,color:"FFFFFF"})]
});

const callout = (title,lines,tf=C.blue,bf=C.lightBlue) => {
  const rows = [new TableRow({children:[new TableCell({
    borders:bdrs(),width:{size:9360,type:WidthType.DXA},
    shading:{fill:tf,type:ShadingType.CLEAR},margins:cmW,
    children:[new Paragraph({children:[new TextRun({text:title,font:"Arial",size:22,bold:true,color:"FFFFFF"})]})]
  })]})];
  lines.forEach(ln=>rows.push(new TableRow({children:[new TableCell({
    borders:bdrs(),width:{size:9360,type:WidthType.DXA},
    shading:{fill:bf,type:ShadingType.CLEAR},margins:cmW,
    children:[new Paragraph({children:[run(ln)]})]
  })]})));
  return new Table({width:{size:9360,type:WidthType.DXA},columnWidths:[9360],rows});
};

const statusTag = (text,fill,color="FFFFFF") => new TableCell({
  borders:bdrs(),width:{size:1000,type:WidthType.DXA},
  shading:{fill,type:ShadingType.CLEAR},margins:cm,
  children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text,font:"Arial",size:18,bold:true,color})]})]
});

// Two-col table
const twoCol = (h1t,h2t,rows,w1=2600,w2=6760) => {
  const hdr = new TableRow({children:[
    new TableCell({borders:bdrs(),width:{size:w1,type:WidthType.DXA},shading:{fill:C.navy,type:ShadingType.CLEAR},margins:cm,
      children:[new Paragraph({children:[new TextRun({text:h1t,font:"Arial",size:20,bold:true,color:"FFFFFF"})]})] }),
    new TableCell({borders:bdrs(),width:{size:w2,type:WidthType.DXA},shading:{fill:C.navy,type:ShadingType.CLEAR},margins:cm,
      children:[new Paragraph({children:[new TextRun({text:h2t,font:"Arial",size:20,bold:true,color:"FFFFFF"})]})] }),
  ]});
  const drs = rows.map(([l,r],i)=>new TableRow({children:[
    new TableCell({borders:bdrs(),width:{size:w1,type:WidthType.DXA},shading:{fill:i%2===0?C.lightGray:C.white,type:ShadingType.CLEAR},margins:cm,
      children:[new Paragraph({children:[new TextRun({text:l,font:"Courier New",size:19,color:"C7254E"})]})] }),
    new TableCell({borders:bdrs(),width:{size:w2,type:WidthType.DXA},shading:{fill:i%2===0?C.lightGray:C.white,type:ShadingType.CLEAR},margins:cm,
      children:[new Paragraph({children:[new TextRun({text:r,font:"Arial",size:20,color:C.dark})]})] }),
  ]}));
  return new Table({width:{size:w1+w2,type:WidthType.DXA},columnWidths:[w1,w2],rows:[hdr,...drs]});
};

// Plain two-col (no code font on left)
const twoColPlain = (h1t,h2t,rows,w1=2600,w2=6760) => {
  const hdr = new TableRow({children:[
    new TableCell({borders:bdrs(),width:{size:w1,type:WidthType.DXA},shading:{fill:C.navy,type:ShadingType.CLEAR},margins:cm,
      children:[new Paragraph({children:[new TextRun({text:h1t,font:"Arial",size:20,bold:true,color:"FFFFFF"})]})] }),
    new TableCell({borders:bdrs(),width:{size:w2,type:WidthType.DXA},shading:{fill:C.navy,type:ShadingType.CLEAR},margins:cm,
      children:[new Paragraph({children:[new TextRun({text:h2t,font:"Arial",size:20,bold:true,color:"FFFFFF"})]})] }),
  ]});
  const drs = rows.map(([l,r],i)=>new TableRow({children:[
    new TableCell({borders:bdrs(),width:{size:w1,type:WidthType.DXA},shading:{fill:i%2===0?C.lightGray:C.white,type:ShadingType.CLEAR},margins:cm,
      children:[new Paragraph({children:[new TextRun({text:l,font:"Arial",size:20,bold:true,color:C.dark})]})] }),
    new TableCell({borders:bdrs(),width:{size:w2,type:WidthType.DXA},shading:{fill:i%2===0?C.lightGray:C.white,type:ShadingType.CLEAR},margins:cm,
      children:[new Paragraph({children:[new TextRun({text:r,font:"Arial",size:20,color:C.dark})]})] }),
  ]}));
  return new Table({width:{size:w1+w2,type:WidthType.DXA},columnWidths:[w1,w2],rows:[hdr,...drs]});
};

// Three-col table
const threeCol = (h1t,h2t,h3t,rows,w1=2400,w2=3480,w3=3480) => {
  const hdr = new TableRow({children:[h1t,h2t,h3t].map((h,i)=>new TableCell({
    borders:bdrs(),width:{size:[w1,w2,w3][i],type:WidthType.DXA},
    shading:{fill:C.navy,type:ShadingType.CLEAR},margins:cm,
    children:[new Paragraph({children:[new TextRun({text:h,font:"Arial",size:20,bold:true,color:"FFFFFF"})]})]
  }))});
  const drs = rows.map(([c1,c2,c3],i)=>new TableRow({children:[c1,c2,c3].map((c,j)=>new TableCell({
    borders:bdrs(),width:{size:[w1,w2,w3][j],type:WidthType.DXA},
    shading:{fill:i%2===0?C.lightGray:C.white,type:ShadingType.CLEAR},margins:cm,
    children:[new Paragraph({children:[new TextRun({text:c,font:j===0?"Courier New":"Arial",size:j===0?19:20,color:j===0?"C7254E":C.dark})]})]
  }))}));
  return new Table({width:{size:w1+w2+w3,type:WidthType.DXA},columnWidths:[w1,w2,w3],rows:[hdr,...drs]});
};

// Four-col screen spec table
const screenTable = (rows) => {
  const w = [2400,2000,2400,2560];
  const heads = ["File (new name)","Status","API Endpoints","Description"];
  const hdr = new TableRow({children:heads.map((h,i)=>new TableCell({
    borders:bdrs(),width:{size:w[i],type:WidthType.DXA},
    shading:{fill:C.navy,type:ShadingType.CLEAR},margins:cm,
    children:[new Paragraph({children:[new TextRun({text:h,font:"Arial",size:19,bold:true,color:"FFFFFF"})]})]
  }))});
  const drs = rows.map(([file,status,api,desc],i)=>{
    const statusFill = status==="EXISTS"?C.green:status==="RENAME"?"E67E22":status==="REDESIGN"?C.orange:status==="BUILD"?C.blue:"888888";
    return new TableRow({children:[
      new TableCell({borders:bdrs(),width:{size:w[0],type:WidthType.DXA},shading:{fill:i%2===0?C.lightGray:C.white,type:ShadingType.CLEAR},margins:cm,
        children:[new Paragraph({children:[new TextRun({text:file,font:"Courier New",size:18,color:"C7254E"})]})] }),
      new TableCell({borders:bdrs(),width:{size:w[1],type:WidthType.DXA},shading:{fill:statusFill,type:ShadingType.CLEAR},margins:cm,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:status,font:"Arial",size:18,bold:true,color:"FFFFFF"})]})] }),
      new TableCell({borders:bdrs(),width:{size:w[2],type:WidthType.DXA},shading:{fill:i%2===0?C.lightGray:C.white,type:ShadingType.CLEAR},margins:cm,
        children:[new Paragraph({children:[new TextRun({text:api,font:"Courier New",size:17,color:"0EA5E9"})]})] }),
      new TableCell({borders:bdrs(),width:{size:w[3],type:WidthType.DXA},shading:{fill:i%2===0?C.lightGray:C.white,type:ShadingType.CLEAR},margins:cm,
        children:[new Paragraph({children:[new TextRun({text:desc,font:"Arial",size:19,color:C.dark})]})] }),
    ]});
  });
  return new Table({width:{size:w.reduce((a,b)=>a+b,0),type:WidthType.DXA},columnWidths:w,rows:[hdr,...drs]});
};

// Component spec table
const compTable = (rows) => {
  const w = [2400,2000,4960];
  const heads = ["File (new name)","Status","Purpose & Props"];
  const hdr = new TableRow({children:heads.map((h,i)=>new TableCell({
    borders:bdrs(),width:{size:w[i],type:WidthType.DXA},
    shading:{fill:C.navy,type:ShadingType.CLEAR},margins:cm,
    children:[new Paragraph({children:[new TextRun({text:h,font:"Arial",size:19,bold:true,color:"FFFFFF"})]})]
  }))});
  const drs = rows.map(([file,status,desc],i)=>{
    const statusFill = status==="EXISTS"?C.green:status==="RENAME"?"E67E22":status==="REDESIGN"?C.orange:status==="BUILD"?C.blue:status==="DELETE"?C.red:"888888";
    return new TableRow({children:[
      new TableCell({borders:bdrs(),width:{size:w[0],type:WidthType.DXA},shading:{fill:i%2===0?C.lightGray:C.white,type:ShadingType.CLEAR},margins:cm,
        children:[new Paragraph({children:[new TextRun({text:file,font:"Courier New",size:18,color:"C7254E"})]})] }),
      new TableCell({borders:bdrs(),width:{size:w[1],type:WidthType.DXA},shading:{fill:statusFill,type:ShadingType.CLEAR},margins:cm,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:status,font:"Arial",size:18,bold:true,color:"FFFFFF"})]})] }),
      new TableCell({borders:bdrs(),width:{size:w[2],type:WidthType.DXA},shading:{fill:i%2===0?C.lightGray:C.white,type:ShadingType.CLEAR},margins:cm,
        children:[new Paragraph({children:[new TextRun({text:desc,font:"Arial",size:19,color:C.dark})]})] }),
    ]});
  });
  return new Table({width:{size:w.reduce((a,b)=>a+b,0),type:WidthType.DXA},columnWidths:w,rows:[hdr,...drs]});
};

// Code block (dark bg)
const codeBlock = (lines) => {
  const children = lines.map(line=>new Paragraph({
    spacing:{before:0,after:0},
    shading:{fill:"1E1E2E",type:ShadingType.CLEAR},
    children:[new TextRun({
      text:line||" ", font:"Courier New", size:18,
      color: line.trim().startsWith("//")?"6A9955"
           : line.trim().startsWith("import")?"C586C0"
           : line.includes("'")?"CE9178"
           : /^(export|const|type|interface|function|return|from)\b/.test(line.trim())?"569CD6"
           : "D4D4D4"
    })]
  }));
  return new Table({
    width:{size:9360,type:WidthType.DXA},columnWidths:[9360],
    rows:[new TableRow({children:[new TableCell({
      borders:bdrs("333355"),width:{size:9360,type:WidthType.DXA},
      shading:{fill:"1E1E2E",type:ShadingType.CLEAR},
      margins:{top:120,bottom:120,left:200,right:200},
      children
    })]})]
  });
};

// Folder tree block
const folderBlock = (lines) => {
  const children = lines.map(line=>new Paragraph({
    spacing:{before:0,after:0},
    shading:{fill:"1A1A2E",type:ShadingType.CLEAR},
    children:[new TextRun({
      text:line||" ", font:"Courier New", size:18,
      color: line.includes("/")?"4EC9B0"
           : line.includes(".tsx")||line.includes(".ts")?"CE9178"
           : line.trim().startsWith("─")?"569CD6"
           : "D4D4D4"
    })]
  }));
  return new Table({
    width:{size:9360,type:WidthType.DXA},columnWidths:[9360],
    rows:[new TableRow({children:[new TableCell({
      borders:bdrs("333355"),width:{size:9360,type:WidthType.DXA},
      shading:{fill:"1A1A2E",type:ShadingType.CLEAR},
      margins:{top:120,bottom:120,left:200,right:200},
      children
    })]})]
  });
};

// Status legend
const legend = () => {
  const items = [
    ["EXISTS","166534","File exists, name is correct, no redesign needed"],
    ["RENAME","E67E22","File exists but name does not follow convention"],
    ["REDESIGN","9A3412","File exists but must be redesigned per TDD spec"],
    ["BUILD","2E75B6","Does not exist yet — must be built in V1"],
    ["DELETE","991B1B","Remove from codebase. Do not ship."],
  ];
  const rows = items.map(([label,fill,desc],i)=>new TableRow({children:[
    new TableCell({borders:bdrs(),width:{size:1400,type:WidthType.DXA},shading:{fill,type:ShadingType.CLEAR},margins:cm,
      children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:label,font:"Arial",size:19,bold:true,color:"FFFFFF"})]})] }),
    new TableCell({borders:bdrs(),width:{size:7960,type:WidthType.DXA},shading:{fill:i%2===0?C.lightGray:C.white,type:ShadingType.CLEAR},margins:cm,
      children:[new Paragraph({children:[run(desc)]})] }),
  ]}));
  return new Table({width:{size:9360,type:WidthType.DXA},columnWidths:[1400,7960],rows});
};

// ═══════════════════════════════════════════════════════════════════
// DOCUMENT
// ═══════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering:{config:[
    {reference:"bullets",levels:[
      {level:0,format:LevelFormat.BULLET,text:"\u2022",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}},
      {level:1,format:LevelFormat.BULLET,text:"\u25E6",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:1080,hanging:360}}}},
    ]},
    {reference:"nums",levels:[
      {level:0,format:LevelFormat.DECIMAL,text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}},
      {level:1,format:LevelFormat.DECIMAL,text:"%1.%2.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:1080,hanging:360}}}},
    ]},
  ]},
  styles:{
    default:{document:{run:{font:"Arial",size:22,color:C.dark}}},
    paragraphStyles:[
      {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:40,bold:true,font:"Arial",color:C.navy},paragraph:{spacing:{before:560,after:200},outlineLevel:0}},
      {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:30,bold:true,font:"Arial",color:C.blue},paragraph:{spacing:{before:400,after:160},outlineLevel:1}},
      {id:"Heading3",name:"Heading 3",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:24,bold:true,font:"Arial",color:C.dark},paragraph:{spacing:{before:280,after:120},outlineLevel:2}},
    ]
  },
  sections:[{
    properties:{page:{size:{width:12240,height:15840},margin:{top:1080,right:1080,bottom:1080,left:1080}}},
    children:[

// ── COVER ─────────────────────────────────────────────────────────
new Paragraph({spacing:{before:1200,after:0},alignment:AlignmentType.CENTER,
  children:[new TextRun({text:"SURESTEP",font:"Arial",size:88,bold:true,color:C.navy})]}),
new Paragraph({spacing:{before:80,after:0},alignment:AlignmentType.CENTER,
  children:[new TextRun({text:"Frontend Technical Design Document",font:"Arial",size:40,color:C.blue})]}),
new Paragraph({spacing:{before:80,after:0},alignment:AlignmentType.CENTER,
  border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.blue,space:6}},
  children:[new TextRun({text:"Full Vision  \u00B7  Screens, Components, Navigation & API Wiring",font:"Arial",size:26,color:C.mid,italics:true})]}),
sp(400),
new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:80},
  children:[new TextRun({text:"Companion document to the SureStep Backend TDD.",font:"Arial",size:22,color:C.dark,italics:true})]}),
new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:0},
  children:[new TextRun({text:"Every screen in this document maps directly to API endpoints defined in the Backend TDD Section 4.",font:"Arial",size:22,color:C.dark,italics:true})]}),
sp(400),
new Table({width:{size:9360,type:WidthType.DXA},columnWidths:[2800,6560],rows:[
  ...[
    ["Stack","React Native \u00B7 Expo (migrating to EAS/Prebuild)"],
    ["Language","TypeScript \u2014 all files .tsx or .ts, no .jsx or .js"],
    ["Navigation","React Navigation v6 \u2014 per-role navigator trees"],
    ["State","React Context + hooks \u2014 SecureStore for auth tokens"],
    ["Theme","Single source of truth: src/theme/ \u2014 tokens, colors, fonts"],
    ["Backend TDD","Companion document \u2014 API endpoints referenced per screen"],
    ["Maps","React Native Maps (Google Maps SDK)"],
    ["Status legend","EXISTS \u00B7 RENAME \u00B7 REDESIGN \u00B7 BUILD \u00B7 DELETE"],
  ].map(([l,r])=>new TableRow({children:[
    new TableCell({borders:noBdrs,width:{size:2800,type:WidthType.DXA},margins:cm,
      children:[new Paragraph({children:[new TextRun({text:l,font:"Arial",size:20,bold:true,color:C.mid})]})] }),
    new TableCell({borders:noBdrs,width:{size:6560,type:WidthType.DXA},margins:cm,
      children:[new Paragraph({children:[new TextRun({text:r,font:"Arial",size:20,color:C.dark})]})] }),
  ]}))
]}),
sp(400),
new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:0},
  border:{top:{style:BorderStyle.SINGLE,size:2,color:C.blue,space:4}},
  children:[new TextRun({text:"Confidential \u2014 Internal Use Only",font:"Arial",size:18,color:C.mid,italics:true})]}),
pgBrk(),

// ── SECTION 1: STATUS LEGEND ──────────────────────────────────────
secDiv("SECTION 1  \u2014  HOW TO READ THIS DOCUMENT"),sp(),
h1("1. How to Read This Document"),

h2("1.1 Status Tags"),
p("Every file in this document carries one of five status tags. These tell you exactly what to do with each file."),sp(),
legend(),sp(),

h2("1.2 API Column"),
p("The API column in every screen table maps directly to Backend TDD Section 4. The format is:"),
bl("Method + endpoint path — e.g. GET /tasks/patient/:id/today"),
bl("Multiple endpoints separated by line breaks within the cell"),
bl("If a screen has no API dependency (pure UI), the column reads: none"),sp(),

h2("1.3 File Naming Convention"),
twoColPlain("Pattern","Rule / Example",[
  ["Screens",".tsx \u2014 PascalCase + role prefix + descriptive name + Screen \u2014 e.g. PatientHomeScreen.tsx"],
  ["Components",".tsx \u2014 PascalCase + descriptive name, no suffix \u2014 e.g. TaskCard.tsx, SosButton.tsx"],
  ["Navigators",".tsx \u2014 PascalCase + Navigator \u2014 e.g. PatientNavigator.tsx"],
  ["Contexts",".tsx \u2014 PascalCase + Context \u2014 e.g. AuthContext.tsx, TaskContext.tsx"],
  ["Hooks",".ts \u2014 use prefix + PascalCase \u2014 e.g. useAuth.ts, usePatientState.ts"],
  ["Utils",".ts \u2014 camelCase \u2014 e.g. geofenceUtils.ts, buildDashboardModel.ts"],
  ["Theme / tokens",".ts \u2014 camelCase \u2014 e.g. colors.ts, tokens.ts, fonts.ts"],
  ["Types",".ts \u2014 camelCase \u2014 e.g. api.types.ts, navigation.types.ts"],
  ["No .jsx or .js","All files must be .tsx (components/screens) or .ts (logic/utils/types)"],
],2400,6960),sp(),
pgBrk(),

// ── SECTION 2: FOLDER STRUCTURE ───────────────────────────────────
secDiv("SECTION 2  \u2014  FOLDER STRUCTURE"),sp(),
h1("2. Folder Structure"),

h2("2.1 Corrected Structure"),
p("The current project mixes screen-specific components inside app/screens/, has two competing theme systems, and places context files inconsistently. The structure below is the target. Migrate to it as you touch each area."),sp(),
folderBlock([
"surestep-app/",
"\u251C\u2500\u2500 App.tsx                        \u2190 Expo entry point. Renders AppShell only.",
"\u251C\u2500\u2500 app.json",
"\u251C\u2500\u2500 tsconfig.json",
"\u251C\u2500\u2500 package.json",
"",
"\u251C\u2500\u2500 src/",
"\u2502   \u251C\u2500\u2500 navigation/                  \u2190 All navigators live here",
"\u2502   \u2502   \u251C\u2500\u2500 RoleNavigator.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 PatientNavigator.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 CaregiverNavigator.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 FamilyNavigator.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 AuthNavigator.tsx",
"\u2502   \u2502   \u2514\u2500\u2500 DoctorNavigator.tsx",
"\u2502   \u2502",
"\u2502   \u251C\u2500\u2500 screens/                     \u2190 One file per screen. No components inside here.",
"\u2502   \u2502   \u251C\u2500\u2500 auth/",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 WelcomeScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 PhoneAuthScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 RoleSelectionScreen.tsx",
"\u2502   \u2502   \u2502   \u2514\u2500\u2500 ProfileSetupScreen.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 patient/",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 PatientHomeScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 PatientGamesScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 PatientStoriesScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 PatientActivitiesScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 PatientWorkoutScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 PatientRelaxingScreen.tsx",
"\u2502   \u2502   \u2502   \u2514\u2500\u2500 PatientSettingsScreen.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 caregiver/",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverTriageScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverPatientDetailScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverPatientMapScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverPatientAlertsScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverPatientRoutinesScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverPatientShiftsScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverRoutineEditorScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverGeofenceEditorScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverAlertFeedScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverCalendarScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverMessagesScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverShiftHandoverScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverWellbeingScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverProfileEditScreen.tsx",
"\u2502   \u2502   \u2502   \u2514\u2500\u2500 CaregiverSettingsScreen.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 family/",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 FamilyFeedScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 FamilyMapScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 FamilyAlertsScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 FamilyStoriesScreen.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 FamilyMessagesScreen.tsx",
"\u2502   \u2502   \u2502   \u2514\u2500\u2500 FamilySettingsScreen.tsx",
"\u2502   \u2502   \u2514\u2500\u2500 doctor/",
"\u2502   \u2502       \u251C\u2500\u2500 DoctorPatientListScreen.tsx",
"\u2502   \u2502       \u251C\u2500\u2500 DoctorCognitiveReportScreen.tsx",
"\u2502   \u2502       \u2514\u2500\u2500 DoctorAssessmentDetailScreen.tsx",
"\u2502   \u2502",
"\u2502   \u251C\u2500\u2500 components/                  \u2190 Reusable UI components, organised by domain",
"\u2502   \u2502   \u251C\u2500\u2500 shared/                  \u2190 Used across multiple roles",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 ScreenContainer.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 SosButton.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 AiAssistantFab.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 ConfirmModal.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 AlertBadge.tsx",
"\u2502   \u2502   \u2502   \u2514\u2500\u2500 LoadingSpinner.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 patient/",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 OrientationStrip.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 TaskCard.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 TaskStepGuide.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 CaregiverPresenceTile.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 MoodCheckIn.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 VoiceMessagePlayer.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 StoryFeedCard.tsx",
"\u2502   \u2502   \u2502   \u2514\u2500\u2500 PatientNavCard.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 caregiver/",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 PatientTriageRow.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 PatientStateCard.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 AlertFeedItem.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 TaskListItem.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 RoutineTemplateCard.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 GeofenceZoneCard.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 ShiftHandoverForm.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 VoiceNoteRecorder.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 Sparkline.tsx",
"\u2502   \u2502   \u2502   \u2514\u2500\u2500 ConcentricRings.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 family/",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 PeaceOfMindCard.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 StoryComposer.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 VoiceSampleRecorder.tsx",
"\u2502   \u2502   \u2502   \u2514\u2500\u2500 EmergencyConsensusPanel.tsx",
"\u2502   \u2502   \u2514\u2500\u2500 forms/",
"\u2502   \u2502       \u251C\u2500\u2500 TextInputField.tsx",
"\u2502   \u2502       \u251C\u2500\u2500 PhoneInputField.tsx",
"\u2502   \u2502       \u251C\u2500\u2500 DropdownPicker.tsx",
"\u2502   \u2502       \u2514\u2500\u2500 ProfileForm.tsx",
"\u2502   \u2502",
"\u2502   \u251C\u2500\u2500 games/                       \u2190 Cognitive game components",
"\u2502   \u2502   \u251C\u2500\u2500 MemoryMatchGame.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 WordFinderGame.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 ColorSortGame.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 SoundRecallGame.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 PicturePuzzleGame.tsx",
"\u2502   \u2502   \u2514\u2500\u2500 OrientationCheckGame.tsx",
"\u2502   \u2502",
"\u2502   \u251C\u2500\u2500 activities/                  \u2190 Therapeutic activity components",
"\u2502   \u2502   \u251C\u2500\u2500 relaxing/",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 MusicListenActivity.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 GratitudeActivity.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 NatureSoundsActivity.tsx",
"\u2502   \u2502   \u2502   \u251C\u2500\u2500 GentleStretchActivity.tsx",
"\u2502   \u2502   \u2502   \u2514\u2500\u2500 HandMassageActivity.tsx",
"\u2502   \u2502   \u2514\u2500\u2500 workout/",
"\u2502   \u2502       \u251C\u2500\u2500 ChairMarchExercise.tsx",
"\u2502   \u2502       \u251C\u2500\u2500 DeepBreathingExercise.tsx",
"\u2502   \u2502       \u251C\u2500\u2500 ArmCirclesExercise.tsx",
"\u2502   \u2502       \u251C\u2500\u2500 HeelRaisesExercise.tsx",
"\u2502   \u2502       \u2514\u2500\u2500 NeckRollsExercise.tsx",
"\u2502   \u2502",
"\u2502   \u251C\u2500\u2500 context/                     \u2190 All context providers",
"\u2502   \u2502   \u251C\u2500\u2500 AuthContext.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 TaskContext.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 PatientStateContext.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 GeofenceContext.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 VoiceContext.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 CognitionContext.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 AlertContext.tsx",
"\u2502   \u2502   \u251C\u2500\u2500 FamiliarityContext.tsx",
"\u2502   \u2502   \u2514\u2500\u2500 NotificationContext.tsx",
"\u2502   \u2502",
"\u2502   \u251C\u2500\u2500 hooks/                       \u2190 Custom hooks extracted from contexts",
"\u2502   \u2502   \u251C\u2500\u2500 useAuth.ts",
"\u2502   \u2502   \u251C\u2500\u2500 usePatientState.ts",
"\u2502   \u2502   \u251C\u2500\u2500 useTasks.ts",
"\u2502   \u2502   \u251C\u2500\u2500 useGeofence.ts",
"\u2502   \u2502   \u251C\u2500\u2500 useAlerts.ts",
"\u2502   \u2502   \u251C\u2500\u2500 useVoice.ts",
"\u2502   \u2502   \u2514\u2500\u2500 useCognition.ts",
"\u2502   \u2502",
"\u2502   \u251C\u2500\u2500 theme/                       \u2190 Single source of truth for all styling",
"\u2502   \u2502   \u251C\u2500\u2500 colors.ts",
"\u2502   \u2502   \u251C\u2500\u2500 tokens.ts",
"\u2502   \u2502   \u251C\u2500\u2500 fonts.ts",
"\u2502   \u2502   \u2514\u2500\u2500 ThemeContext.tsx",
"\u2502   \u2502",
"\u2502   \u251C\u2500\u2500 services/                    \u2190 API call functions, one file per backend module",
"\u2502   \u2502   \u251C\u2500\u2500 authService.ts",
"\u2502   \u2502   \u251C\u2500\u2500 userService.ts",
"\u2502   \u2502   \u251C\u2500\u2500 taskService.ts",
"\u2502   \u2502   \u251C\u2500\u2500 locationService.ts",
"\u2502   \u2502   \u251C\u2500\u2500 alertService.ts",
"\u2502   \u2502   \u251C\u2500\u2500 voiceService.ts",
"\u2502   \u2502   \u251C\u2500\u2500 cognitionService.ts",
"\u2502   \u2502   \u251C\u2500\u2500 storyService.ts",
"\u2502   \u2502   \u251C\u2500\u2500 messageService.ts",
"\u2502   \u2502   \u251C\u2500\u2500 medicationService.ts",
"\u2502   \u2502   \u251C\u2500\u2500 appointmentService.ts",
"\u2502   \u2502   \u251C\u2500\u2500 reportService.ts",
"\u2502   \u2502   \u2514\u2500\u2500 apiClient.ts             \u2190 Axios instance with JWT interceptor",
"\u2502   \u2502",
"\u2502   \u251C\u2500\u2500 types/                       \u2190 Shared TypeScript types",
"\u2502   \u2502   \u251C\u2500\u2500 api.types.ts             \u2190 Response shapes matching backend schema",
"\u2502   \u2502   \u251C\u2500\u2500 navigation.types.ts      \u2190 Route param types for all navigators",
"\u2502   \u2502   \u2514\u2500\u2500 enums.ts                 \u2190 Frontend mirror of backend ENUM types",
"\u2502   \u2502",
"\u2502   \u2514\u2500\u2500 utils/                       \u2190 Pure utility functions",
"\u2502       \u251C\u2500\u2500 geofenceUtils.ts",
"\u2502       \u251C\u2500\u2500 buildDashboardModel.ts",
"\u2502       \u251C\u2500\u2500 dateUtils.ts",
"\u2502       \u2514\u2500\u2500 offlineQueue.ts",
]),sp(),

h2("2.2 Files to Delete Immediately"),
callout("DELETE — Remove from codebase before next commit",[
  "app/screens/HomeScreen.tsx            \u2014 Unused placeholder, no route points here intentionally",
  "app/screens/DetailsScreen.tsx         \u2014 Unused placeholder",
  "app/screens/DevRoleSwitchScreen.tsx   \u2014 Dev-only, must never ship. Gate behind __DEV__ if keeping locally.",
  "app/patient/mockState.ts              \u2014 Mock data. Remove entirely. Backend API provides real data.",
  "packages/ui/theme/                    \u2014 Duplicate theme system. Consolidate into src/theme/ only.",
  "packages/core/auth/AuthContext.tsx    \u2014 Move to src/context/AuthContext.tsx then delete packages/core/.",
],C.red,C.lightRed),sp(),

h2("2.3 Theme — Single Source of Truth"),
p("There are currently two theme systems: packages/ui/theme/ and app/theme/. This causes inconsistency. Consolidate everything into src/theme/ and delete the packages/ui/theme/ folder."),sp(),
twoColPlain("File","Responsibility",[
  ["src/theme/colors.ts","Full colour palette. Exports the C object used everywhere. Includes patient-specific palette (no red), caregiver palette, family palette."],
  ["src/theme/tokens.ts","Raw design tokens: spacing scale, border radius, font sizes, shadow definitions, z-index scale."],
  ["src/theme/fonts.ts","Exports useInterFonts() hook. Loads Inter font family before app renders. Called once in AppShell."],
  ["src/theme/ThemeContext.tsx","Light/dark theme provider. Exports useTheme() hook. Wraps entire app. Single instance."],
],2800,6560),sp(),

h2("2.4 Services Layer"),
p("Every API call goes through src/services/. No screen or component calls fetch() or axios directly. This is what connects the frontend to the backend TDD."),sp(),
codeBlock([
"// src/services/apiClient.ts",
"// Single Axios instance. JWT injected automatically on every request.",
"// Refresh token rotation handled here \u2014 no screen needs to know about it.",
"",
"import axios from 'axios';",
"import { getTokens, saveTokens, clearTokens } from '../utils/secureStore';",
"",
"const apiClient = axios.create({",
"  baseURL: process.env.EXPO_PUBLIC_API_URL, // https://api.surestep.in/v1",
"  timeout: 10000,",
"});",
"",
"// Request interceptor: attach access token",
"apiClient.interceptors.request.use(async (config) => {",
"  const { accessToken } = await getTokens();",
"  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;",
"  return config;",
"});",
"",
"// Response interceptor: handle 401, attempt refresh, retry once",
"apiClient.interceptors.response.use(",
"  (res) => res,",
"  async (error) => {",
"    if (error.response?.status === 401) {",
"      // attempt refresh \u2014 on failure, clear tokens and redirect to auth",
"    }",
"    return Promise.reject(error);",
"  }",
");",
"",
"export default apiClient;",
]),sp(),
pgBrk(),

// ── SECTION 3: NAVIGATION ─────────────────────────────────────────
secDiv("SECTION 3  \u2014  NAVIGATION ARCHITECTURE"),sp(),
h1("3. Navigation Architecture"),

h2("3.1 Overview"),
p("The current RootNavigator registers ALL screens for ALL roles in one giant Native Stack. This is a security and architecture problem. The target structure uses separate navigator trees per role. The RoleNavigator reads auth state and mounts the correct tree. A patient can never navigate to a caregiver screen because those routes do not exist in their navigator."),sp(),

h2("3.2 Provider & Navigator Tree"),
folderBlock([
"App.tsx",
"\u2514\u2500\u2500 AppShell (src/AppShell.tsx)",
"    \u251C\u2500\u2500 GestureHandlerRootView",
"    \u251C\u2500\u2500 ThemeContext.tsx          \u2190 Theme first, everything reads theme",
"    \u251C\u2500\u2500 AuthContext.tsx           \u2190 Auth state, tokens from SecureStore",
"    \u251C\u2500\u2500 NotificationContext.tsx   \u2190 FCM token registration",
"    \u2514\u2500\u2500 SafeAreaProvider",
"        \u2514\u2500\u2500 NavigationContainer",
"            \u2514\u2500\u2500 RoleNavigator.tsx     \u2190 Reads auth.role, mounts correct tree",
"                \u251C\u2500\u2500 AuthNavigator.tsx         (not logged in)",
"                \u251C\u2500\u2500 PatientNavigator.tsx      (role = PATIENT)",
"                \u2502   \u251C\u2500\u2500 PatientStateContext.tsx",
"                \u2502   \u251C\u2500\u2500 TaskContext.tsx",
"                \u2502   \u251C\u2500\u2500 VoiceContext.tsx",
"                \u2502   \u251C\u2500\u2500 CognitionContext.tsx",
"                \u2502   \u2514\u2500\u2500 FamiliarityContext.tsx",
"                \u251C\u2500\u2500 CaregiverNavigator.tsx    (role = CAREGIVER)",
"                \u2502   \u251C\u2500\u2500 PatientStateContext.tsx",
"                \u2502   \u251C\u2500\u2500 TaskContext.tsx",
"                \u2502   \u251C\u2500\u2500 GeofenceContext.tsx",
"                \u2502   \u2514\u2500\u2500 AlertContext.tsx",
"                \u251C\u2500\u2500 FamilyNavigator.tsx       (role = FAMILY)",
"                \u2502   \u251C\u2500\u2500 AlertContext.tsx",
"                \u2502   \u2514\u2500\u2500 PatientStateContext.tsx",
"                \u2514\u2500\u2500 DoctorNavigator.tsx       (role = DOCTOR)",
]),sp(),

p("Contexts are mounted INSIDE their role navigator, not globally in AppShell. A caregiver never loads VoiceContext. A patient never loads PatientStateContext (the multi-patient map). This keeps memory usage lean and data scope clean."),sp(),

h2("3.3 RoleNavigator Logic"),
codeBlock([
"// src/navigation/RoleNavigator.tsx",
"",
"const RoleNavigator = () => {",
"  const { status, user } = useAuth();",
"",
"  if (status === 'loading')       return <ProfileLoadingScreen />;",
"  if (status === 'unauthenticated') return <AuthNavigator />;",
"  if (status === 'no_role')       return <AuthNavigator initialRoute='RoleSelectionScreen' />;",
"  if (status === 'no_profile')    return <AuthNavigator initialRoute='ProfileSetupScreen' />;",
"",
"  switch (user.role) {",
"    case 'PATIENT':   return <PatientNavigator />;",
"    case 'CAREGIVER': return <CaregiverNavigator />;",
"    case 'FAMILY':    return <FamilyNavigator />;",
"    case 'DOCTOR':    return <DoctorNavigator />;",
"    default:          return <AuthNavigator />;",
"  }",
"};",
]),sp(),

h2("3.4 AuthNavigator"),
p("Handles all unauthenticated and onboarding flows. Family members arrive here via deep link from an invite URL."),sp(),
screenTable([
  ["WelcomeScreen.tsx","EXISTS","none","First splash screen. CTA goes to PhoneAuthScreen."],
  ["PhoneAuthScreen.tsx","EXISTS","POST /auth/otp/request\nPOST /auth/otp/verify","Phone + OTP login. On success writes tokens to SecureStore, navigates to RoleNavigator."],
  ["RoleSelectionScreen.tsx","RENAME","none","Was RoleEntryScreen.tsx. New user selects PATIENT / CAREGIVER / FAMILY."],
  ["ProfileSetupScreen.tsx","REDESIGN","PUT /profiles/patient\nPUT /profiles/caregiver\nPUT /profiles/family","Was ProfileSetup.tsx. Wizard. Step 1: name, language. Step 2: role-specific fields. Minimum viable — ask for least possible upfront."],
  ["InviteAcceptScreen.tsx","BUILD","POST /relationships/accept-invite/:token","Family member arrives via deep link. Shows patient name and relationship type. One tap to join."],
]),sp(),

h2("3.5 PatientNavigator"),
p("Stack navigator with 4-card centred home navigation. No bottom tab bar. SosButton and OrientationStrip are rendered as persistent overlays at the navigator level, not inside individual screens."),sp(),
screenTable([
  ["PatientHomeScreen.tsx","REDESIGN","GET /tasks/patient/:id/today\nPOST /tasks/:id/complete\nPOST /tasks/:id/unsure\nPOST /cognition/mood-checkin","Was PatientRoleScreen.tsx. Single-task full-screen. Voice note auto-plays. TTS on all text. STT for Done/Unsure. Caregiver presence tile. Orientation strip. 4 nav cards at centre."],
  ["PatientGamesScreen.tsx","EXISTS","POST /cognition/sessions","Games hub. Horizontal paging carousel. 6 game types. Metric collection on every session."],
  ["PatientStoriesScreen.tsx","BUILD","GET /stories/patient/:id/feed\nPOST /stories/:id/react","New screen. Family stories feed. Most recent unshown story shown first. Voice read-aloud. Heart/Smile/Wave reaction."],
  ["PatientActivitiesScreen.tsx","REDESIGN","none (content from DB, Phase 2)","Was PatientActivitiesScreen.tsx. Currently hardcoded. Redesign to support database-driven content. For V1, keep hardcoded but structure for easy migration."],
  ["PatientWorkoutScreen.tsx","EXISTS","none","Workout hub. 5 guided exercises."],
  ["PatientRelaxingScreen.tsx","EXISTS","none","Relaxing activities hub. Plays favourite songs from FamiliarityContext."],
  ["PatientSettingsScreen.tsx","RENAME","GET /users/me\nGET /profiles/patient/:id","Was MoreScreen.tsx. Profile view, notification prefs, privacy, logout."],
]),sp(),

h2("3.6 CaregiverNavigator"),
p("Bottom tab bar: Patients | Alerts | Calendar | Messages | Settings. Each patient tap opens a nested stack with patient-specific tabs."),sp(),
screenTable([
  ["CaregiverTriageScreen.tsx","REDESIGN","GET /awareness/my-patients","Was CaregiverPatientsScreen.tsx. Ranked patient list. Each row shows safety state, routine state, last ping, battery. Sorted by who needs attention most. This is the home screen, not individual dashboards."],
  ["CaregiverPatientDetailScreen.tsx","RENAME","GET /awareness/patient/:id\nGET /tasks/patient/:id/today","Was CaregiverDashboardScreen.tsx. Opens from triage row tap. Contains nested tabs: State, Routines, Map, Alerts, Shifts."],
  ["CaregiverPatientRoutinesScreen.tsx","REDESIGN","GET /tasks/patient/:id/today\nPOST /tasks/patient/:id\nPATCH /tasks/:id\nDELETE /tasks/:id\nPOST /media/upload/voice-note","Was CaregiverManageScreen.tsx. Task list with voice note recording per task. CRUD. Route template assignment."],
  ["CaregiverRoutineEditorScreen.tsx","RENAME","POST /tasks/patient/:id\nPATCH /tasks/:id\nGET /routines/templates","Was RoutineEditorScreen.tsx. Create or edit a task with full fields including voice note recorder."],
  ["CaregiverPatientMapScreen.tsx","REDESIGN","GET /location/patient/:id/current\nGET /location/patient/:id/trail\nGET /geofences/patient/:id\nGET /alerts/geofence/patient/:id","Was GeofenceMapScreen.tsx. Live patient location. Trail. Zone overlays. Incident response flow (not a Maps handoff). Acknowledge \u2192 call \u2192 navigate \u2192 resolve, all in-app."],
  ["CaregiverGeofenceEditorScreen.tsx","RENAME","GET /geofences/patient/:id\nPOST /geofences/patient/:id\nPATCH /geofences/:zone_id\nDELETE /geofences/:zone_id","Was GeofenceEditorScreen.tsx. Draggable pin, radius selector, zone type presets, active hours, soft/hard boundary toggle."],
  ["CaregiverPatientAlertsScreen.tsx","BUILD","GET /alerts/patient/:id\nPOST /alerts/:id/acknowledge","New screen. Alert list for a specific patient. Filter by type, severity, status."],
  ["CaregiverAlertFeedScreen.tsx","BUILD","GET /alerts/caregiver/feed","New screen. Cross-patient alert feed. Batch acknowledge. Replaces the per-patient alert tab as the primary alert entry point."],
  ["CaregiverCalendarScreen.tsx","BUILD","GET /appointments/patient/:id\nPOST /appointments/patient/:id\nGET /shifts/patient/:id","New screen. Shared calendar for all patients. Appointment and shift view toggled."],
  ["CaregiverMessagesScreen.tsx","BUILD","GET /messages/threads/patient/:id\nGET /messages/threads/:thread_id\nPOST /messages/threads/:thread_id","New screen. Patient-scoped message threads between caregiver and family."],
  ["CaregiverPatientShiftsScreen.tsx","BUILD","GET /shifts/patient/:id\nPOST /shifts/:id/checkin\nPOST /shifts/:id/checkout","New screen. Shift list for patient. Check-in with GPS confirmation. Check-out."],
  ["CaregiverShiftHandoverScreen.tsx","BUILD","POST /shifts/:id/handover","New screen. Structured handover form. Mood summary, tasks, medication, watch-for. Sent to incoming caregiver."],
  ["CaregiverWellbeingScreen.tsx","BUILD","POST /wellbeing/checkin\nGET /reports/wellbeing/caregiver","New screen. Daily mood and stress check-in. Trend chart over last 30 days. Micro-break prompt."],
  ["CaregiverProfileEditScreen.tsx","EXISTS","PUT /profiles/caregiver\nPOST /media/upload/photo","Professional profile edit. Bio, rates, specialisations, availability. Progressive — not all fields required."],
  ["CaregiverSettingsScreen.tsx","BUILD","GET /users/me\nGET /auth/sessions\nDELETE /auth/sessions/:id","Settings, device management, privacy, logout."],
]),sp(),

h2("3.7 FamilyNavigator"),
p("Bottom tab bar: Home | Map | Stories | Messages | Settings. The home feed adapts based on relationship_type: GUARDIAN sees full detail, FAMILY_CLOSE sees summary, FAMILY_EXTENDED sees digest pill only."),sp(),
screenTable([
  ["FamilyFeedScreen.tsx","REDESIGN","GET /reports/family-digest/patient/:id\nGET /alerts/patient/:id","Was FamilyDashboardScreen.tsx. Completely redesigned. Two modes: GREEN (calm card, patient is fine) and ALERT (urgent card, one clear action). Relationship-type-aware depth. Not a data-dense dashboard."],
  ["FamilyMapScreen.tsx","BUILD","GET /location/patient/:id/current\nGET /geofences/patient/:id","New screen. Read-only map. Patient location and safe zones. No editing. Tap to open full view."],
  ["FamilyAlertsScreen.tsx","BUILD","GET /alerts/patient/:id\nPOST /alerts/:id/acknowledge","New screen. Alert history. Emergency consensus panel shown for Level 3 alerts."],
  ["FamilyStoriesScreen.tsx","BUILD","POST /stories/patient/:id\nGET /stories/patient/:id/feed","New screen. Family members post photos, voice notes, text stories. View the feed of what patient has seen."],
  ["FamilyMessagesScreen.tsx","BUILD","GET /messages/threads/patient/:id\nPOST /messages/threads/:thread_id","New screen. Patient-scoped thread between family members and caregiver."],
  ["FamilySettingsScreen.tsx","BUILD","PUT /profiles/family\nPOST /voice/samples\nGET /voice/samples/patient/:id\nDELETE /voice/samples/:id","New screen. Notification preferences, voice sample recording, digest frequency, privacy."],
]),sp(),

h2("3.8 DoctorNavigator"),
screenTable([
  ["DoctorPatientListScreen.tsx","RENAME","GET /relationships/my-patients","Was DoctorRoleScreen.tsx. Simple list of patients this doctor has access to."],
  ["DoctorCognitiveReportScreen.tsx","BUILD","GET /cognition/assessments/patient/:id\nGET /cognition/sessions/patient/:id","New screen. Domain score trends, session history, anomaly flags."],
  ["DoctorAssessmentDetailScreen.tsx","BUILD","GET /cognition/assessments/patient/:id","New screen. Single assessment period detail. Clinician notes input field. Export trigger."],
]),sp(),
pgBrk(),

// ── SECTION 4: COMPONENTS ─────────────────────────────────────────
secDiv("SECTION 4  \u2014  COMPONENTS"),sp(),
h1("4. Components"),

h2("4.1 Shared Components"),
p("Used across two or more roles. Live in src/components/shared/."),sp(),
compTable([
  ["ScreenContainer.tsx","EXISTS","Wraps every screen with consistent padding and safe area insets. All screens use this as their root wrapper."],
  ["SosButton.tsx","BUILD","Fixed position, bottom-right, red (#DC2626), 64x64dp. Always rendered at the PatientNavigator level, visible on every patient screen. Single press \u2192 ConfirmModal. Second press \u2192 calls POST /sos/patient/:id."],
  ["AiAssistantFab.tsx","RENAME","Was AiFab.tsx. Floating action button. Visible on patient Activities and Games screens. Rewire to real AI endpoint when backend is ready. Keep component, replace keyword-matching with API call."],
  ["ConfirmModal.tsx","BUILD","Full-screen confirmation modal. Props: title, message, confirmLabel, onConfirm, onCancel. Used for SOS, delete actions, destructive changes. Minimum 48sp text. Two taps to confirm."],
  ["AlertBadge.tsx","BUILD","Unread alert count badge. Used on CaregiverNavigator tab bar. Driven by AlertContext."],
  ["LoadingSpinner.tsx","BUILD","Centred loading indicator. Branded colour. Used on ProfileLoadingScreen and async data fetches."],
]),sp(),

h2("4.2 Patient Components"),
p("Live in src/components/patient/. Used only within PatientNavigator."),sp(),
compTable([
  ["OrientationStrip.tsx","BUILD","Persistent strip at top of every patient screen. Shows: day of week (large), date, time, city, weather icon + temperature. Updates every minute. Font size minimum 20sp. Cannot be dismissed."],
  ["TaskCard.tsx","BUILD","Full-screen task display. Props: task object. Shows emoji (large), title, patient_hint, scheduled time. Auto-plays voice_note_url on mount if present. TTS reads hint aloud on tap. Done and Unsure buttons minimum 64dp height."],
  ["TaskStepGuide.tsx","BUILD","Expandable step-by-step guide within TaskCard. Triggered by 'Show me how' tap. Each step displayed one at a time with TTS."],
  ["CaregiverPresenceTile.tsx","BUILD","Small card below OrientationStrip. Shows caregiver photo and 'Priya is looking after you today.' Tapping opens caregiver contact info. Driven by AuthContext confirmed caregiver relationship."],
  ["MoodCheckIn.tsx","BUILD","Once-daily prompt. 3 large buttons: Good \u2764\uFE0F / Okay \U0001F610 / Not great \U0001F614. POST /cognition/mood-checkin. Shown on PatientHomeScreen after first task of the day. Never shown more than once per day."],
  ["VoiceMessagePlayer.tsx","BUILD","Audio player for incoming voice messages. Auto-plays queued message when received. Shows sender name and photo. Driven by VoiceContext. Patient can replay with single tap."],
  ["StoryFeedCard.tsx","BUILD","Displays one family story at a time. Photo, caption read aloud, reaction buttons (Heart/Smile/Wave). POST /stories/:id/react. Auto-advances to next unshown story."],
  ["PatientNavCard.tsx","BUILD","One of 4 large centred navigation cards on PatientHomeScreen. Props: icon (emoji), label, destination route. Minimum 120x120dp. No small icons."],
]),sp(),

h2("4.3 Caregiver Components"),
p("Live in src/components/caregiver/. Used only within CaregiverNavigator."),sp(),
compTable([
  ["PatientTriageRow.tsx","BUILD","Single row in CaregiverTriageScreen. Shows: patient avatar, name, safety state chip (colour-coded), routine state chip, last ping time, battery bar. Entire row is tappable. No nested tappable elements."],
  ["PatientStateCard.tsx","REDESIGN","Was the patient card in CaregiverDashboardScreen. Now shows 4-dimension state (location, safety, routine, engagement) as coloured chips in a compact card. Used at top of CaregiverPatientDetailScreen."],
  ["AlertFeedItem.tsx","BUILD","Single alert row. Shows: severity colour bar, alert type label, patient name, time ago, acknowledge button. Batch selection checkbox. Used in both CaregiverAlertFeedScreen and CaregiverPatientAlertsScreen."],
  ["TaskListItem.tsx","BUILD","Single task row for caregiver view. Shows: emoji, title, scheduled time, status chip, voice note indicator (if voice_note_url exists), edit and delete actions. Swipe-to-edit."],
  ["RoutineTemplateCard.tsx","BUILD","Template card in library view. Shows title, category, steps count, is_critical flag. One-tap assign to patient."],
  ["GeofenceZoneCard.tsx","BUILD","Zone summary card below map. Shows label, zone type, radius, boundary type (SOFT/HARD), active hours if set. Edit and delete actions."],
  ["ShiftHandoverForm.tsx","BUILD","Structured form: mood summary picker, tasks summary text, medication summary text, observations text, watch-for text. Submit calls POST /shifts/:id/handover."],
  ["VoiceNoteRecorder.tsx","BUILD","Inline audio recorder. Record, preview, re-record, save. Saves to S3 via POST /media/upload/voice-note. Returns voice_note_url. Used inside CaregiverRoutineEditorScreen."],
  ["Sparkline.tsx","RENAME","Was in app/screens/patientDetail/. Move to src/components/caregiver/. Small inline trend chart. Props: data[], color, width, height."],
  ["ConcentricRings.tsx","RENAME","Was in app/screens/patientDetail/. Move to src/components/caregiver/. Animated ring visualisation for adherence indicator."],
]),sp(),

h2("4.4 Family Components"),
p("Live in src/components/family/. Used only within FamilyNavigator."),sp(),
compTable([
  ["PeaceOfMindCard.tsx","BUILD","The main family home card. Two visual states. GREEN: large green card, patient name, calm message e.g. 'Maa is having a good morning', last updated time. ALERT: amber or red card, alert description, one primary action button. Relationship-type drives data depth shown."],
  ["StoryComposer.tsx","BUILD","Story creation interface. Media type selector: Photo | Voice Note | Text | Video Memo. Photo picker, voice recorder, text input. Caption field. is_birthday toggle. POST /stories/patient/:id."],
  ["VoiceSampleRecorder.tsx","BUILD","Guided voice sample recording flow for family. Step-by-step: record greeting, come-home message, medication reminder. Preview and approve each. Consent checkbox with full text. POST /voice/samples with consent_given_at."],
  ["EmergencyConsensusPanel.tsx","BUILD","Shown on Level 3 alerts. Lists all GUARDIAN family members and acknowledgement status. 'Who has seen this?' Shows a green tick per person who acknowledged. Drives urgency without creating panic."],
]),sp(),

h2("4.5 Form Components"),
p("Live in src/components/forms/. Used across all roles in profile setup and editing."),sp(),
compTable([
  ["TextInputField.tsx","RENAME","Was TextInputField.jsx. Styled text input. Props: label, value, onChangeText, error, placeholder, keyboardType. Consistent height and border across all forms."],
  ["PhoneInputField.tsx","RENAME","Was PhoneInputField.jsx. Phone input with country code (+91 default). Props: value, onChangeText, error."],
  ["DropdownPicker.tsx","RENAME","Was DropdownPicker.jsx. Styled dropdown. Props: options[], value, onSelect, label, error."],
  ["ProfileForm.tsx","EXISTS","Reusable profile field group. Used in ProfileSetupScreen and caregiver/family profile edit screens."],
]),sp(),
pgBrk(),

// ── SECTION 5: GAMES & ACTIVITIES ────────────────────────────────
secDiv("SECTION 5  \u2014  GAMES & ACTIVITIES"),sp(),
h1("5. Games & Activities"),

h2("5.1 Cognitive Games"),
p("Live in src/games/. All rendered inside PatientGamesScreen via horizontal paging carousel. Every game reports a session to POST /cognition/sessions on completion via CognitionContext."),sp(),
compTable([
  ["MemoryMatchGame.tsx","EXISTS","Card flip pairs game. Emoji tiles. Move counter. Restart. Reports: recall_accuracy, error_count, duration_seconds."],
  ["WordFinderGame.tsx","EXISTS","Tap letters to spell target word. Progress pill. Reports: sequence_error, touch_hesitation_ms, completion rate."],
  ["ColorSortGame.tsx","EXISTS","Identify and match dot colours. Reports: reaction_time_ms, error_count, session duration."],
  ["SoundRecallGame.tsx","EXISTS","Play audio tone pattern, match to correct picture. 3 rounds. Reports: recall_accuracy per round, avg_reaction_ms."],
  ["PicturePuzzleGame.tsx","EXISTS","Swap tiles to sort 1\u21924. Move counter. Reports: move efficiency, completion_time, error_count."],
  ["OrientationCheckGame.tsx","BUILD","Morning orientation check disguised as a greeting. Day, date, city questions. 3 large button options. Warm affirming feedback. Reports: orientation_correct per domain (time, day, city). See Backend TDD Section 7 for full flow."],
]),sp(),

h2("5.2 Session Metric Reporting"),
p("CognitionContext accumulates metric events during a game session and flushes the full session payload to POST /cognition/sessions on completion. If offline, the payload is queued in offlineQueue.ts and sent on reconnect."),sp(),
codeBlock([
"// src/context/CognitionContext.tsx",
"// Pattern: accumulate during play, flush on session end",
"",
"type MetricEvent = {",
"  metric_type: MetricType;",
"  value: number;",
"  context?: Record<string, unknown>;",
"  sequence_no: number;",
"  recorded_at: string;",
"};",
"",
"// During game: call recordMetric() on every measurable event",
"// On game end: call endSession() which POSTs full payload",
"// On offline: offlineQueue.enqueue(payload) \u2192 synced on reconnect",
]),sp(),

h2("5.3 Relaxing Activities"),
p("Live in src/activities/relaxing/. Rendered inside PatientRelaxingScreen. MusicListenActivity reads favourite songs from FamiliarityContext so it plays the patient's own music, not generic tracks."),sp(),
compTable([
  ["MusicListenActivity.tsx","REDESIGN","Was hardcoded tracks. Now reads favourite_songs from FamiliarityContext (loaded from patient_profiles.favourite_songs). Falls back to platform playlist if none set."],
  ["GratitudeActivity.tsx","EXISTS","Gratitude reflection. Guided prompts."],
  ["NatureSoundsActivity.tsx","EXISTS","Nature soundscape. Audio playback."],
  ["GentleStretchActivity.tsx","EXISTS","Guided gentle stretching."],
  ["HandMassageActivity.tsx","EXISTS","Hand massage guidance."],
]),sp(),

h2("5.4 Workout Exercises"),
p("Live in src/activities/workout/. Rendered inside PatientWorkoutScreen."),sp(),
compTable([
  ["ChairMarchExercise.tsx","EXISTS","Seated chair marching with guided count."],
  ["DeepBreathingExercise.tsx","EXISTS","Guided deep breathing with visual timer."],
  ["ArmCirclesExercise.tsx","EXISTS","Arm circles with rep counter."],
  ["HeelRaisesExercise.tsx","EXISTS","Heel raises with rep counter."],
  ["NeckRollsExercise.tsx","EXISTS","Neck rolls with directional guide."],
]),sp(),
pgBrk(),

// ── SECTION 6: CONTEXTS & HOOKS ──────────────────────────────────
secDiv("SECTION 6  \u2014  CONTEXTS & HOOKS"),sp(),
h1("6. Contexts & Hooks"),

h2("6.1 Context Architecture"),
p("Contexts are mounted inside their role navigator, not globally. This keeps scope clean and memory lean. Each context exports a custom hook that is the only way components access it."),sp(),
twoColPlain("Context","Scope \u00B7 Mounted In \u00B7 Backend Source",[
  ["AuthContext.tsx","Global \u2014 AppShell. Reads tokens from SecureStore on app start. Exposes: status, user, role, login(), logout(). No component calls SecureStore directly."],
  ["TaskContext.tsx","Patient + Caregiver navigators. WebSocket room patient:{id}. Exposes today's tasks, CRUD functions. Offline queue for completions."],
  ["PatientStateContext.tsx","Caregiver + Family navigators. WebSocket room patient:{id} for each confirmed patient. Exposes map of patient_id \u2192 patient_states row."],
  ["GeofenceContext.tsx","Caregiver navigator. Loaded for active patient view. Exposes zones, safety_state, breach alerts."],
  ["VoiceContext.tsx","Patient navigator only. WebSocket for incoming voice messages. Manages playback queue. Exposes: queue, play(), markHeard()."],
  ["CognitionContext.tsx","Patient navigator only. Local session state. Accumulates metrics during game play. Exposes: startSession(), recordMetric(), endSession()."],
  ["AlertContext.tsx","Caregiver + Family navigators. WebSocket alert:new events. Exposes unread count, feed, acknowledge()."],
  ["FamiliarityContext.tsx","Patient navigator only. Loaded on patient login. Exposes: assets[], favourite_songs[], today's story asset."],
  ["NotificationContext.tsx","Global \u2014 AppShell. FCM token registration. Handles foreground message routing to correct context."],
],2800,6560),sp(),

h2("6.2 Hook Pattern"),
p("Every context exposes exactly one custom hook. Components never import the context object directly."),sp(),
codeBlock([
"// Pattern for every context file",
"// Example: src/context/TaskContext.tsx",
"",
"const TaskContext = createContext<TaskContextType | null>(null);",
"",
"export const TaskProvider = ({ children }: { children: ReactNode }) => {",
"  // state and logic here",
"  return <TaskContext.Provider value={...}>{children}</TaskContext.Provider>;",
"};",
"",
"// The ONLY export components use",
"export const useTasks = () => {",
"  const ctx = useContext(TaskContext);",
"  if (!ctx) throw new Error('useTasks must be used within TaskProvider');",
"  return ctx;",
"};",
]),sp(),

h2("6.3 Migrating Existing Contexts"),
twoColPlain("Current file","Action",[
  ["packages/core/auth/AuthContext.tsx","Move to src/context/AuthContext.tsx. Convert to .tsx standard. Replace in-memory state with SecureStore persistence. Delete packages/core/."],
  ["app/context/userProfileContext.js","Rename to src/context/UserProfileContext.tsx. Merge hasProfileForRouting logic into AuthContext.status field. Delete original."],
  ["app/context/taskContext.ts","Move to src/context/TaskContext.tsx. Rename to .tsx. Add offline queue support."],
  ["app/context/caregiverContext.ts","Rename to src/context/PatientStateContext.tsx. Restructure to hold map of patient_id \u2192 state rather than a single caregiver state object."],
  ["app/context/geofenceContext.tsx","Move to src/context/GeofenceContext.tsx. Already .tsx \u2014 just move."],
  ["packages/ui/theme/ThemeProvider.tsx","Move to src/theme/ThemeContext.tsx. Delete packages/ui/. This is the single theme source."],
],2800,6560),sp(),
pgBrk(),

// ── SECTION 7: PATIENT UX RULES ──────────────────────────────────
secDiv("SECTION 7  \u2014  PATIENT UX — NON-NEGOTIABLE RULES"),sp(),
h1("7. Patient UX — Non-Negotiable Rules"),

h2("7.1 Why Patient UX Gets Its Own Section"),
p("The patient experience is the highest-risk surface in SureStep. A confused elderly user cannot call support. A bad interaction at 7am on a Tuesday is a failed product. These rules are not suggestions. Every patient-facing PR must be reviewed against this list."),sp(),

h2("7.2 The Rules"),
callout("Patient UX Rules \u2014 Every screen, every component, every interaction",[
  "1.  One thing at a time: PatientHomeScreen shows exactly one task. Not a list. Not a scroll view of cards.",
  "2.  4-card centred navigation: PatientNavCard components in a 2x2 grid at centre of home screen. No bottom tab bar.",
  "3.  OrientationStrip always visible: Day, date, time, city, weather on every patient screen. Top. Large text. Cannot be dismissed.",
  "4.  CaregiverPresenceTile always visible: Caregiver name and photo on home screen. 'Priya is with you today.'",
  "5.  Voice note first: If task.voice_note_url exists, audio plays automatically when TaskCard mounts. Text is secondary.",
  "6.  TTS on every tap: Any Text element on patient screens plays audio when tapped. Implement via onPress on all Text nodes.",
  "7.  STT for primary actions: 'Done' and 'Not sure' can be spoken. Passive STT listening when TaskCard is visible.",
  "8.  No red, no warning icons: Zero alarming visual language on any patient screen. Urgency is voice only.",
  "9.  SosButton always present: Fixed, bottom-right, red. Rendered at PatientNavigator level. Never hidden.",
  "10. Large touch targets: All interactive elements minimum 64x64dp. No exceptions.",
  "11. ConfirmModal for destructive actions: Full-screen, 48sp+ text, two steps. No small inline confirms.",
  "12. No badges, no notification numbers: Patients do not see unread counts or alert badges.",
  "13. No navigation depth beyond 2 levels: Patient can always get home in one tap.",
]),sp(),

h2("7.3 Colours — Patient Palette"),
twoColPlain("Token","Usage on patient screens",[
  ["patient.primary","Warm blue \u2014 primary CTA buttons (Done), active state"],
  ["patient.soft","Soft lavender \u2014 background of TaskCard, calm surfaces"],
  ["patient.accent","Warm amber \u2014 Unsure button, secondary actions"],
  ["patient.text","Near-black \u2014 all patient text, high contrast for readability"],
  ["patient.bg","Off-white warm \u2014 screen background, never pure white or cold grey"],
  ["sos.red","#DC2626 \u2014 SOS button only. No other element uses this colour on patient screens."],
  ["FORBIDDEN","No #EF4444, no orange warnings, no red text, no yellow caution icons on any patient screen"],
],2800,6560),sp(),
pgBrk(),

// ── SECTION 8: BACKEND WIRING ─────────────────────────────────────
secDiv("SECTION 8  \u2014  BACKEND WIRING REFERENCE"),sp(),
h1("8. Backend Wiring Reference"),

h2("8.1 API Client Setup"),
p("All API calls go through src/services/apiClient.ts. This is an Axios instance with JWT auto-injection and refresh token rotation. No screen or component imports axios directly."),sp(),

h2("8.2 Service Files — One Per Backend Module"),
p("Each file in src/services/ maps to one module in the backend TDD. Function names match the action, not the endpoint."),sp(),
twoColPlain("Service file","Functions (examples)",[
  ["authService.ts","requestOtp(), verifyOtp(), refreshToken(), logout(), getSessions(), revokeSession()"],
  ["taskService.ts","getTodaysTasks(), getTasksByDate(), createTask(), updateTask(), deleteTask(), completeTask(), markUnsure(), uploadVoiceNote()"],
  ["locationService.ts","postPing(), getCurrentLocation(), getTrail(), getRouteHistory()"],
  ["alertService.ts","getAlerts(), getCaregiversFeed(), acknowledgeAlert(), triggerSos()"],
  ["voiceService.ts","uploadSample(), getSamples(), deleteSample(), triggerVoiceMessage(), getVoiceMessages()"],
  ["storyService.ts","getStoryFeed(), postStory(), reactToStory()"],
  ["cognitionService.ts","postGameSession(), getSessions(), getAssessments(), postMoodCheckin()"],
  ["reportService.ts","getFamilyDigest(), getCaregiverSummary()"],
  ["appointmentService.ts","getAppointments(), createAppointment(), updateAppointment(), completeAppointment()"],
  ["messageService.ts","getThreads(), createThread(), getMessages(), sendMessage(), markRead()"],
  ["medicationService.ts","getMedications(), addMedication(), updateMedication(), logAdministration()"],
],3200,6160),sp(),

h2("8.3 WebSocket Connection"),
p("Real-time state updates (patient location, task completions, alerts) are delivered via WebSocket. The connection is established inside each role navigator on mount."),sp(),
codeBlock([
"// src/services/socketClient.ts",
"// Rooms are scoped by patient_id to prevent data leakage across patients.",
"",
"import { io, Socket } from 'socket.io-client';",
"",
"let socket: Socket | null = null;",
"",
"export const connectSocket = (accessToken: string) => {",
"  socket = io(process.env.EXPO_PUBLIC_API_URL, {",
"    auth: { token: accessToken },",
"    transports: ['websocket'],",
"  });",
"  return socket;",
"};",
"",
"// Each context subscribes to its relevant events on mount:",
"// TaskContext:         socket.on('task:update', ...)",
"// PatientStateContext: socket.on('state:change', ...)",
"// AlertContext:        socket.on('alert:new', ...)",
"// VoiceContext:        socket.on('voice:message', ...)",
]),sp(),

h2("8.4 Offline Queue"),
p("Tasks completed offline, game sessions played offline, and location pings captured offline are queued and synced on reconnect. The queue is persisted to SecureStore so it survives app restarts."),sp(),
codeBlock([
"// src/utils/offlineQueue.ts",
"// Simple persistent queue backed by SecureStore.",
"",
"type QueuedRequest = {",
"  id: string;",
"  endpoint: string;",
"  method: 'POST' | 'PATCH';",
"  body: unknown;",
"  queuedAt: string;",
"};",
"",
"// On reconnect: flush queue in order, retry failed items once, discard stale items > 24h",
]),sp(),
pgBrk(),

// ── SECTION 9: MIGRATION PLAN ─────────────────────────────────────
secDiv("SECTION 9  \u2014  MIGRATION PLAN"),sp(),
h1("9. Migration Plan — Current to Target"),

h2("9.1 What to Do First"),
p("Do not try to migrate everything at once. This order minimises broken states during the migration."),sp(),
nl("Delete dead files immediately: HomeScreen.tsx, DetailsScreen.tsx, DevRoleSwitchScreen.tsx, mockState.ts."),
nl("Create the src/ folder structure as defined in Section 2. Empty files with placeholder exports."),
nl("Move AuthContext from packages/core/auth/ to src/context/AuthContext.tsx. Replace in-memory state with SecureStore. Update all imports. Delete packages/core/."),
nl("Consolidate theme: move packages/ui/theme/ into src/theme/. Delete packages/ui/. Update all imports."),
nl("Create src/services/apiClient.ts with Axios instance and JWT interceptor. This is the foundation for all API calls."),
nl("Rename all .jsx and .js files to .tsx. Fix any type errors that surface. Do not skip this \u2014 mixed extensions cause tooling issues."),
nl("Create per-role navigators (PatientNavigator, CaregiverNavigator, FamilyNavigator) as empty stacks. Update RoleNavigator to mount them. Move screens into their correct navigator one role at a time."),
nl("Rename screens and components to follow the naming convention. Update all navigation references."),
nl("Move patientDetail components (Sparkline, ConcentricRings, buildDashboardModel) to their correct locations in src/components/caregiver/ and src/utils/."),
nl("Wire existing screens to the backend via service files. Start with auth and tasks \u2014 these unblock everything else."),sp(),

h2("9.2 Complete File Rename Map"),
p("Every file that needs to be renamed. Old name \u2192 new name. All paths relative to src/."),sp(),
twoColPlain("Old file (current)","New file (target)",[
  ["app/App.tsx","src/AppShell.tsx"],
  ["app/navigation/RoleNavigator.tsx","src/navigation/RoleNavigator.tsx"],
  ["app/navigation/RootNavigator.tsx","DELETE \u2014 replaced by per-role navigators"],
  ["app/navigation/DoctorNavigator.tsx","src/navigation/DoctorNavigator.tsx"],
  ["app/screens/WelcomeScreen.tsx","src/screens/auth/WelcomeScreen.tsx"],
  ["app/screens/PhoneAuthScreen.tsx","src/screens/auth/PhoneAuthScreen.tsx"],
  ["app/screens/RoleEntryScreen.tsx","src/screens/auth/RoleSelectionScreen.tsx"],
  ["app/screens/ProfileSetup.tsx","src/screens/auth/ProfileSetupScreen.tsx"],
  ["app/screens/ProfileLoadingScreen.tsx","DELETE \u2014 loading state handled in RoleNavigator"],
  ["app/screens/ProfileView.jsx","src/screens/shared/ProfileViewScreen.tsx"],
  ["app/screens/ProfileEdit.jsx","src/screens/shared/ProfileEditScreen.tsx"],
  ["app/screens/PatientRoleScreen.tsx","src/screens/patient/PatientHomeScreen.tsx"],
  ["app/screens/PatientActivitiesScreen.tsx","src/screens/patient/PatientActivitiesScreen.tsx"],
  ["app/screens/PatientGamesScreen.tsx","src/screens/patient/PatientGamesScreen.tsx"],
  ["app/screens/PatientWorkoutScreen.tsx","src/screens/patient/PatientWorkoutScreen.tsx"],
  ["app/screens/PatientRelaxingScreen.tsx","src/screens/patient/PatientRelaxingScreen.tsx"],
  ["app/screens/PatientFamilyScreen.tsx","DELETE \u2014 replaced by CaregiverPresenceTile on PatientHomeScreen"],
  ["app/screens/PatientFamilyProfileScreen.tsx","DELETE \u2014 caregiver info shown in CaregiverPresenceTile modal"],
  ["app/screens/PatientDetailScreen.tsx","src/screens/caregiver/CaregiverPatientDetailScreen.tsx"],
  ["app/screens/CaregiverPatientsScreen.tsx","src/screens/caregiver/CaregiverTriageScreen.tsx"],
  ["app/screens/CaregiverDashboardScreen.tsx","src/screens/caregiver/CaregiverPatientDetailScreen.tsx (merged)"],
  ["app/screens/CaregiverManageScreen.tsx","src/screens/caregiver/CaregiverPatientRoutinesScreen.tsx"],
  ["app/screens/CaregiverProfileEditScreen.tsx","src/screens/caregiver/CaregiverProfileEditScreen.tsx"],
  ["app/screens/CaregiverDetailView.tsx","src/components/caregiver/CaregiverProfileCard.tsx (component, not screen)"],
  ["app/screens/CaregiverSearchView.tsx","src/screens/auth/CaregiverSearchScreen.tsx (only used during patient onboarding)"],
  ["app/screens/RoutineManagerScreen.tsx","src/screens/caregiver/CaregiverPatientRoutinesScreen.tsx (merged)"],
  ["app/screens/RoutineEditorScreen.tsx","src/screens/caregiver/CaregiverRoutineEditorScreen.tsx"],
  ["app/screens/GeofenceMapScreen.tsx","src/screens/caregiver/CaregiverPatientMapScreen.tsx"],
  ["app/screens/GeofenceEditorScreen.tsx","src/screens/caregiver/CaregiverGeofenceEditorScreen.tsx"],
  ["app/screens/FamilyDashboardScreen.tsx","src/screens/family/FamilyFeedScreen.tsx"],
  ["app/screens/AskAiScreen.tsx","src/screens/patient/PatientAiScreen.tsx"],
  ["app/screens/MoreScreen.tsx","src/screens/patient/PatientSettingsScreen.tsx"],
  ["app/screens/ActivityDetailScreen.tsx","src/screens/patient/ActivityDetailScreen.tsx"],
  ["app/screens/ActivityPlayScreen.tsx","src/screens/patient/ActivityPlayScreen.tsx"],
  ["app/screens/ActivityReportsScreen.tsx","src/screens/patient/ActivityReportsScreen.tsx"],
  ["app/screens/HomeScreen.tsx","DELETE"],
  ["app/screens/DetailsScreen.tsx","DELETE"],
  ["app/screens/DoctorRoleScreen.tsx","src/screens/doctor/DoctorPatientListScreen.tsx"],
  ["app/screens/DevRoleSwitchScreen.tsx","DELETE"],
  ["app/screens/patientDetail/ConcentricRings.tsx","src/components/caregiver/ConcentricRings.tsx"],
  ["app/screens/patientDetail/Sparkline.tsx","src/components/caregiver/Sparkline.tsx"],
  ["app/screens/patientDetail/buildDashboardModel.ts","src/utils/buildDashboardModel.ts"],
  ["app/components/AiFab.tsx","src/components/shared/AiAssistantFab.tsx"],
  ["app/components/ProfileForm.tsx","src/components/forms/ProfileForm.tsx"],
  ["app/components/ScreenContainer.tsx","src/components/shared/ScreenContainer.tsx"],
  ["app/components/inputs/TextInputField.jsx","src/components/forms/TextInputField.tsx"],
  ["app/components/inputs/PhoneInputField.jsx","src/components/forms/PhoneInputField.tsx"],
  ["app/components/inputs/DropdownPicker.jsx","src/components/forms/DropdownPicker.tsx"],
  ["app/patient/games/MemoryMatchGame.tsx","src/games/MemoryMatchGame.tsx"],
  ["app/patient/games/WordFinderGame.tsx","src/games/WordFinderGame.tsx"],
  ["app/patient/games/ColorSortGame.tsx","src/games/ColorSortGame.tsx"],
  ["app/patient/games/SoundRecallGame.tsx","src/games/SoundRecallGame.tsx"],
  ["app/patient/games/PicturePuzzleGame.tsx","src/games/PicturePuzzleGame.tsx"],
  ["app/patient/relaxing/MusicListenActivity.tsx","src/activities/relaxing/MusicListenActivity.tsx"],
  ["app/patient/relaxing/GratitudeActivity.tsx","src/activities/relaxing/GratitudeActivity.tsx"],
  ["app/patient/relaxing/NatureSoundsActivity.tsx","src/activities/relaxing/NatureSoundsActivity.tsx"],
  ["app/patient/relaxing/GentleStretchActivity.tsx","src/activities/relaxing/GentleStretchActivity.tsx"],
  ["app/patient/relaxing/HandMassageActivity.tsx","src/activities/relaxing/HandMassageActivity.tsx"],
  ["app/patient/exercises/ChairMarchExercise.tsx","src/activities/workout/ChairMarchExercise.tsx"],
  ["app/patient/exercises/DeepBreathingExercise.tsx","src/activities/workout/DeepBreathingExercise.tsx"],
  ["app/patient/exercises/ArmCirclesExercise.tsx","src/activities/workout/ArmCirclesExercise.tsx"],
  ["app/patient/exercises/HeelRaisesExercise.tsx","src/activities/workout/HeelRaisesExercise.tsx"],
  ["app/patient/exercises/NeckRollsExercise.tsx","src/activities/workout/NeckRollsExercise.tsx"],
  ["app/patient/activityData.ts","src/activities/activityData.ts"],
  ["app/patient/gameProps.ts","src/games/gameProps.ts"],
  ["app/patient/mockState.ts","DELETE"],
  ["app/context/userProfileContext.js","src/context/AuthContext.tsx (merged into auth status)"],
  ["app/context/taskContext.ts","src/context/TaskContext.tsx"],
  ["app/context/caregiverContext.ts","src/context/PatientStateContext.tsx"],
  ["app/context/geofenceContext.tsx","src/context/GeofenceContext.tsx"],
  ["packages/core/auth/AuthContext.tsx","src/context/AuthContext.tsx (then delete packages/)"],
  ["packages/ui/theme/ThemeProvider.tsx","src/theme/ThemeContext.tsx (then delete packages/)"],
  ["packages/ui/theme/tokens.ts","src/theme/tokens.ts"],
  ["app/theme/colors.ts","src/theme/colors.ts"],
  ["app/theme/fonts.ts","src/theme/fonts.ts"],
],3600,5760),sp(),
pgBrk(),

// ── SECTION 10: TYPES ─────────────────────────────────────────────
secDiv("SECTION 10  \u2014  TYPES"),sp(),
h1("10. Types"),

h2("10.1 Why Types Come First"),
p("The frontend types in src/types/ are the contract between frontend and backend. They mirror the backend schema and API response shapes. Define these before building any screen or service function. If the shape changes in the backend TDD, update the types here first, then fix the TypeScript errors that surface."),sp(),

h2("10.2 api.types.ts — Key Types"),
codeBlock([
"// src/types/api.types.ts",
"// Mirror of backend PostgreSQL schema rows and API response shapes.",
"// Keep in sync with Backend TDD Section 3 (schema) and Section 4 (API).",
"",
"export type User = {",
"  id: string;",
"  phone: string;",
"  name: string;",
"  date_of_birth?: string;",
"  gender?: string;",
"  preferred_language: string;",
"  city?: string;",
"  photo_url?: string;",
"  role: UserRoleType;",
"};",
"",
"export type Task = {",
"  id: string;",
"  patient_id: string;",
"  title: string;",
"  patient_hint?: string;",
"  steps: { order: number; text: string }[];",
"  emoji?: string;",
"  voice_note_url?: string;",
"  scheduled_time: string;",
"  scheduled_date: string;",
"  duration_minutes: number;",
"  is_critical: boolean;",
"  status: TaskStatus;",
"  completed_at?: string;",
"};",
"",
"export type PatientState = {",
"  patient_id: string;",
"  location_state: LocationState;",
"  safety_state: SafetyState;",
"  routine_state: RoutineState;",
"  engagement_state: EngagementState;",
"  last_known_lat?: number;",
"  last_known_lng?: number;",
"  last_ping_at?: string;",
"  tasks_total_today: number;",
"  tasks_done_today: number;",
"  battery_pct?: number;",
"  computed_at: string;",
"};",
"",
"// ... Alert, VoiceMessage, FamilyStory, GameSession etc \u2014 one type per backend table",
]),sp(),

h2("10.3 enums.ts — Frontend Mirror of Backend ENUMs"),
codeBlock([
"// src/types/enums.ts",
"// Frontend mirror of all backend ENUM types defined in Backend TDD Section 3.2.",
"// Keep in sync. If a backend ENUM value changes, update here first.",
"",
"export type UserRoleType = 'PATIENT' | 'CAREGIVER' | 'FAMILY' | 'DOCTOR';",
"export type TaskStatus = 'PENDING' | 'DONE' | 'MISSED' | 'UNSURE' | 'SKIPPED';",
"export type SafetyState = 'SAFE' | 'APPROACHING' | 'BREACH' | 'CRITICAL';",
"export type LocationState = 'MOVING' | 'STATIONARY_KNOWN' | 'STATIONARY_UNKNOWN' | 'NO_SIGNAL';",
"export type RoutineState = 'ON_TRACK' | 'BEHIND' | 'MISSED_CRITICAL' | 'ALL_DONE';",
"export type EngagementState = 'ACTIVE' | 'IDLE' | 'NO_INTERACTION';",
"export type AlertType = 'ZONE_EXIT' | 'ZONE_ENTER' | 'APPROACHING_BOUNDARY' |",
"  'STATIONARY_UNKNOWN' | 'ERRATIC_MOVEMENT' | 'WANDERING' | 'NO_SIGNAL' |",
"  'TASK_MISSED_CRITICAL' | 'TASK_UNSURE' | 'MEDICATION_MISSED' |",
"  'MEDICATION_REFILL_DUE' | 'FALL_DETECTED' | 'SOS_TRIGGERED' | 'INACTIVITY';",
"export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';",
"export type GameType = 'MEMORY_MATCH' | 'WORD_FINDER' | 'COLOR_SORT' |",
"  'SOUND_RECALL' | 'FACE_RECOGNITION' | 'ORIENTATION_CHECK' | 'PICTURE_PUZZLE';",
"export type MetricType = 'REACTION_TIME_MS' | 'RECALL_ACCURACY' | 'SEQUENCE_ERROR' |",
"  'TOUCH_HESITATION_MS' | 'ORIENTATION_CORRECT' | 'FACE_RECOGNISED' | 'MOOD_SCORE';",
"export type StoryMediaType = 'PHOTO' | 'VOICE_NOTE' | 'TEXT' | 'VIDEO_MEMO';",
"export type CognitiveTrend = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';",
]),sp(),

h2("10.4 navigation.types.ts — Route Params"),
codeBlock([
"// src/types/navigation.types.ts",
"// Route param types for all navigators.",
"// Every navigation.navigate() call is type-checked against these.",
"",
"export type AuthStackParams = {",
"  WelcomeScreen: undefined;",
"  PhoneAuthScreen: undefined;",
"  RoleSelectionScreen: undefined;",
"  ProfileSetupScreen: { role: UserRoleType };",
"  InviteAcceptScreen: { token: string };",
"};",
"",
"export type PatientStackParams = {",
"  PatientHomeScreen: undefined;",
"  PatientGamesScreen: undefined;",
"  PatientStoriesScreen: undefined;",
"  PatientActivitiesScreen: undefined;",
"  PatientWorkoutScreen: undefined;",
"  PatientRelaxingScreen: undefined;",
"  PatientSettingsScreen: undefined;",
"  ActivityDetailScreen: { activityId: string };",
"  ActivityPlayScreen: { activityId: string };",
"};",
"",
"export type CaregiverStackParams = {",
"  CaregiverTriageScreen: undefined;",
"  CaregiverPatientDetailScreen: { patientId: string; patientName: string };",
"  CaregiverPatientMapScreen: { patientId: string };",
"  CaregiverPatientRoutinesScreen: { patientId: string };",
"  CaregiverPatientAlertsScreen: { patientId: string };",
"  CaregiverPatientShiftsScreen: { patientId: string };",
"  CaregiverRoutineEditorScreen: { patientId: string; taskId?: string };",
"  CaregiverGeofenceEditorScreen: { patientId: string; zoneId?: string };",
"  CaregiverShiftHandoverScreen: { shiftId: string };",
"  CaregiverAlertFeedScreen: undefined;",
"  CaregiverCalendarScreen: undefined;",
"  CaregiverMessagesScreen: { patientId: string };",
"  CaregiverWellbeingScreen: undefined;",
"  CaregiverProfileEditScreen: undefined;",
"  CaregiverSettingsScreen: undefined;",
"};",
"",
"export type FamilyStackParams = {",
"  FamilyFeedScreen: undefined;",
"  FamilyMapScreen: { patientId: string };",
"  FamilyAlertsScreen: undefined;",
"  FamilyStoriesScreen: { patientId: string };",
"  FamilyMessagesScreen: { patientId: string };",
"  FamilySettingsScreen: undefined;",
"};",
]),sp(),
pgBrk(),

// ── APPENDIX ──────────────────────────────────────────────────────
secDiv("APPENDIX"),sp(),
h1("Appendix A \u2014 Screen Count Summary"),
twoColPlain("Category","Count",[
  ["Auth screens","5 (4 exist/rename, 1 build: InviteAcceptScreen)"],
  ["Patient screens","8 (6 exist/rename/redesign, 1 build: PatientStoriesScreen, 1 existing: PatientAiScreen)"],
  ["Caregiver screens","15 (4 exist/rename/redesign, 11 build)"],
  ["Family screens","6 (1 redesign, 5 build)"],
  ["Doctor screens","3 (1 rename, 2 build)"],
  ["Screens to DELETE","7 (HomeScreen, DetailsScreen, DevRoleSwitchScreen, PatientFamilyScreen, PatientFamilyProfileScreen, ProfileLoadingScreen, RootNavigator)"],
  ["Total screens in V1","37"],
],3000,6360),sp(),

h1("Appendix B \u2014 Component Count Summary"),
twoColPlain("Category","Count",[
  ["Shared components","6 (2 exist, 4 build)"],
  ["Patient components","8 (all build)"],
  ["Caregiver components","10 (2 rename/move, 8 build)"],
  ["Family components","4 (all build)"],
  ["Form components","4 (3 rename, 1 exists)"],
  ["Games","6 (5 exist, 1 build: OrientationCheckGame)"],
  ["Activities (relaxing)","5 (4 exist, 1 redesign: MusicListenActivity)"],
  ["Activities (workout)","5 (all exist)"],
  ["Total components","48"],
],3000,6360),sp(),

h1("Appendix C \u2014 Backend TDD Cross-Reference"),
p("This document is the companion to the SureStep Backend TDD. Key cross-references:"),sp(),
twoColPlain("Frontend TDD section","Backend TDD section",[
  ["Section 3 \u2014 Navigation & screen API wiring","Section 4 \u2014 API Contract"],
  ["Section 6 \u2014 Contexts (PatientStateContext)","Section 5 \u2014 Awareness Engine"],
  ["Section 5 \u2014 Games & CognitionContext","Section 7 \u2014 Cognitive Assessment System"],
  ["Section 4 \u2014 VoiceMessagePlayer, VoiceSampleRecorder","Section 8 \u2014 Voice System"],
  ["Section 8 \u2014 WebSocket connection","Section 2.3 \u2014 Real-Time Architecture"],
  ["Section 8 \u2014 Offline queue","Section 6.5 \u2014 Offline Mode"],
  ["Section 10 \u2014 enums.ts","Section 3.2 \u2014 ENUM Type Definitions"],
  ["Section 10 \u2014 api.types.ts","Section 3 \u2014 Database Schema"],
  ["Section 7 \u2014 Patient UX rules","Section 1.5 \u2014 Design Principles (Patient)"],
],3600,5760),sp(200),

new Paragraph({
  alignment:AlignmentType.CENTER,spacing:{before:600,after:0},
  border:{top:{style:BorderStyle.SINGLE,size:2,color:C.blue,space:4}},
  children:[new TextRun({text:"SureStep \u2014 Frontend TDD \u2014 Full Vision \u2014 Confidential",font:"Arial",size:18,color:C.mid,italics:true})]
}),
new Paragraph({
  alignment:AlignmentType.CENTER,spacing:{before:60,after:0},
  children:[new TextRun({text:"React Native (Expo \u2192 EAS) \u00B7 TypeScript \u00B7 Companion to Backend TDD",font:"Arial",size:18,color:C.mid})]
}),

    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('C://dev//web-dev//node-js//SureStep_Frontend_TDD.docx', buf);
  console.log('done');
}).catch(e => { console.error(e); process.exit(1); });