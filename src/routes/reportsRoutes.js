const { Router, request } = require('express');
const router = Router();
const BD = require('../config/configDb');

router.get('/citesCE', async (req, res) => {
    sql = `SELECT 
    SUBSTR(p.p_code,0,2) "Tipo_ID",
    SUBSTR(p.p_code,3)"Num_de_Identificacion",
    axs.APES_NAME3 "Estado_de_la_cita",
    ex.ex_code,
    ex.ex_description,
    p.p_born "Fecha_de_Nacimiento",
    FLOOR(trunc(months_between(a.ap_date,p.p_born)/12)) ||' Años '||FLOOR(MOD(months_between(a.ap_date, p.p_born),12)) ||' Meses '||FLOOR(a.ap_date - add_months(p.p_born, trunc(months_between(a.ap_date, p.p_born)))) ||' Dias' "EDAD",
    decode(p.p_sex,0,'I',1,'M',2,'F') "Sexo",
    p.p_name "Primer_Apellido",
    p.p_fname "Nombre_del_Paciente",
    pad.PA_TOWN "Municipio",
    ot.qpot_code "Modalidad", 
    prop.ASEGURADOR "Entidad",
    pvl.PLV_NAME1 "Aseguradora",
    prop.fECHAD "Fecha_Deseada",
    prop.tipoS "Tipo_Solicitu",
    prop.EAPB "EAPB",
    prop.TIPOU "Tipo_Usuario",
    s2.s_code,
    s2.s_name,
    to_char(a.Ap_Datemade,'YYYY/MM/DD HH24:MI') "F_Creacion_cita",
    to_char(a.ap_date+5*a.ap_startunit/1440,'YYYY/MM/DD HH24:MI') "Fecha_Cita",
    u.u_fname||' '||u.u_name "Usuario_que_asigna"
    FROM sysadm.appointments a
    INNER JOIN sysadm.patients p ON p.p_key=a.ap_patkey
    INNER JOIN sysadm.APPOINTMENT_EXAM_STATUS axs on axs.APES_KEY=a.AP_EXAM_STATUS
    INNER JOIN sysadm.examinations ex ON ex.ex_key = a.ap_examkey
    INNER JOIN sysadm.QPORDER_TYPE ot on ot.qpot_key=ex.EX_ORDERTYPE
    INNER JOIN sysadm.pat_addresses pad ON pad.PA_PATIENT=p.p_key
    INNER JOIN sysadm.users u ON a.ap_madeby=u.U_LOGINNAME
    LEFT OUTER JOIN sysadm.Services S2 ON S2.s_Key = a.Ap_Req_Service
    left OUTER JOIN (select obj.ol_l_appointment ol_l_appointment , MAX (DECODE(  PV_PROPERTY_DEF, 3, pv.PV_STRINGVALUE)) ASEGURADOR,   MAX (DECODE(  PV_PROPERTY_DEF, 11, pv.pv_datevalue)) fECHAD,  MAX (DECODE(  PV_PROPERTY_DEF, 12, pv.PV_STRINGVALUE)) tipoS, MAX (DECODE(  PV_PROPERTY_DEF, 13, pv.PV_STRINGVALUE)) EAPB,  MAX (DECODE(  PV_PROPERTY_DEF, 14, PV.PV_STRINGVALUE)) TIPOU ,  MAX (DECODE(  PV_PROPERTY_DEF, 15, PV.PV_STRINGVALUE)) ASEGURADORA
    from sysadm.property_values pv 
    LEFT JOIN  sysadm.objectlink obj ON pv.pv_key=obj.ol_r_property_value 
    WHERE PV_PROPERTY_DEF IN (3, 11, 12 , 13, 14, 15)
    GROUP BY obj.ol_l_appointment) prop ON prop.ol_l_appointment=a.ap_key
    LEFT OUTER JOIN  sysadm.property_lovs pvl ON pvl.plv_code=prop.ASEGURADORA
    where 1=1 
    and a.ap_date between to_date('01/09/2024', 'dd/mm/yyyy') and to_date('30/09/2024', 'dd/mm/yyyy')
    `;

    let result = await BD.Open(sql, [], false);
    Cites = [];
    previouscite = {}
    result.rows.map(cite => {
        if (cite[19] == "CONSULTA EXTERNA") {
            let userSchema = {
                "Tipo_de_Identificacion": cite[0],
                "Num_de_Identificacion": cite[1],
                "Estado_de_la_Cita": cite[2],
                "EX_CODE": cite[3],
                "EX_DESCRIPTION": cite[4],
                "Fecha_de_Nacimiento": cite[5],
                "Edad": cite[6],
                "Sexo": cite[7],
                "Primer_Apellido": cite[8],
                "Nombre_del_Paciente": cite[9],
                "Municipio": cite[10],
                "Modalidad": cite[11],
                "Entidad": cite[12],
                "Aseguradora": cite[13],
                "Fecha_Deseada": cite[14],
                "Tipo_Solicitud": cite[15],
                "EAPB": cite[16],
                "Tipo_Usuario": cite[17],
                "s_code": cite[18],
                "s_name": cite[19],
                "F_Creacion_Cita": cite[20],
                "Fecha_Cita": cite[21],
                "Usuario_que_Asigna": cite[22]
            }

            if (previouscite == {}) {
                Cites.push(userSchema);
            } else if ((previouscite.Num_de_Identificacion != userSchema.Num_de_Identificacion && previouscite.EX_CODE != userSchema)
                || (previouscite.Num_de_Identificacion != userSchema.Num_de_Identificacion && previouscite.EX_CODE == userSchema.EX_CODE)
                || (previouscite.Num_de_Identificacion == userSchema.Num_de_Identificacion && previouscite.EX_CODE != userSchema.EX_CODE)) {
                Cites.push(userSchema);
            }
            previouscite = userSchema;
        }
    })


    res.json(Cites);
})


router.post('/citesCEFecha', async (req, res) => {
    console.log(req.body);
    sql = `SELECT DISTINCT
p.p_siscode "Identificador Unico",
SUBSTR(p.p_code,0,2)"Tipo de Identificacion",
SUBSTR(p.p_code,3)"Num de Identificacion",
p.p_born "Fecha de Nacimiento",
FLOOR(trunc(months_between(a.ap_date,p.p_born)/12)) ||' Años '||FLOOR(MOD(months_between(a.ap_date, p.p_born),12)) ||' Meses '||FLOOR(a.ap_date - add_months(p.p_born, trunc(months_between(a.ap_date, p.p_born)))) ||' Dias' "Edad",
decode(p.p_sex,0,'I',1,'M',2,'F') "Sexo",
SUBSTR(p.p_name,1, INSTR(p.p_name || ' ',' ') - 1)"Primer Apellido",
SUBSTR(p.p_name, INSTR(p.p_name|| ' ',' ') + 1)"Segundo Apellido",
SUBSTR(p.p_fname, 0, INSTR(p.p_fname|| ' ',' ') - 1)"Primer Nombre",
SUBSTR(p.p_fname, INSTR(p.p_fname|| ' ',' ') + 1)"Segundo Nombre",
p.p_phone "Numero Telefonico del Paciente",
p.p_secondphone "Telefono Movil",
p.p_street "Direccion del Paciente",
p.p_soundex "Email",
p.p_town "Municipio",
l.qpqd_accessionnr "Documento de la cita",
to_char(a.Ap_Datemade,'YYYY/MM/DD HH24:MI') "F. Solicitud cita",
to_char(a.ap_date,'YYYY/MM/DD') "Fecha Cita",
TO_CHAR(TO_DATE('00:00:00', 'HH24:MI:SS') + (a.ap_startunit * 5 / 1440), 'HH24:MI:SS') "Hora Cita",
a.ap_ahd "Tipo de Usuario",
MAX(CASE WHEN h.APH_EXAM_STATUS = 9 THEN TO_CHAR(h.aph_datechanged, 'HH24:MI:SS') END) OVER (PARTITION BY l.qpqd_accessionnr) AS "Hora Proceso",
MAX(CASE WHEN h.APH_EXAM_STATUS = 10 THEN TO_CHAR(h.aph_datechanged, 'HH24:MI:SS') END) OVER (PARTITION BY l.qpqd_accessionnr) AS "Hora Presentado",
MAX(CASE WHEN h.APH_EXAM_STATUS = 12 THEN TO_CHAR(h.aph_datechanged, 'HH24:MI:SS') END) OVER (PARTITION BY l.qpqd_accessionnr) AS "Hora Salida",
prop.TIPOU "Regimen",
TO_CHAR(a.ap_date, 'MONTH','NLS_DATE_LANGUAGE = SPANISH') "Mes",
axs.APES_NAME3 "Estado de la cita",
h.aph_remark "Motivo",
prop.EAPB "cod_Empresa",
pvl.PLV_NAME1 "Empresa",
ex.ex_code "cod_consulta",
ex.ex_description "des_consulta",
SUBSTR(a.ap_clininfo, 2, INSTR(a.ap_clininfo|| ' ',' ') - 1)"epiinadia",
SUBSTR(a.ap_clininfo, INSTR(a.ap_clininfo|| ' ',' ') + 1)"Descripcion Diagnostica",
s2.s_code "Tipo Episodio",
prop.tipoS "tipo_cita_telef_prese",
u.u_fname||' '||u.u_name "nombre_usuario_adicion_cita",
a.ap_examremark "Observacion"
FROM sysadm.appointments a
INNER JOIN sysadm.patients p ON p.p_key=a.ap_patkey
LEFT OUTER  JOIN sysadm.APPOINTMENT_HISTORY h on h.APH_KEY=a.AP_KEY
INNER JOIN sysadm.APPOINTMENT_EXAM_STATUS axs on axs.APES_KEY=a.AP_EXAM_STATUS
INNER JOIN sysadm.examinations ex ON ex.ex_key = a.ap_examkey
INNER JOIN sysadm.QPORDER_TYPE ot on ot.qpot_key=ex.EX_ORDERTYPE
INNER JOIN sysadm.pat_addresses pad ON pad.PA_PATIENT=p.p_key
INNER JOIN sysadm.qpqd_link l ON l.qpqd_qp_appkey=a.ap_key
INNER JOIN sysadm.users u ON a.ap_madeby=u.U_LOGINNAME
LEFT OUTER JOIN sysadm.Services S2 ON S2.s_Key = a.Ap_Req_Service
left OUTER JOIN (select obj.ol_l_appointment ol_l_appointment , MAX (DECODE(  PV_PROPERTY_DEF, 3, pv.PV_STRINGVALUE)) ASEGURADOR,   MAX (DECODE(  PV_PROPERTY_DEF, 11, pv.pv_datevalue)) fECHAD,  MAX (DECODE(  PV_PROPERTY_DEF, 12, pv.PV_STRINGVALUE)) tipoS, MAX (DECODE(  PV_PROPERTY_DEF, 13, pv.PV_STRINGVALUE)) EAPB,  MAX (DECODE(  PV_PROPERTY_DEF, 14, PV.PV_STRINGVALUE)) TIPOU ,  MAX (DECODE(  PV_PROPERTY_DEF, 15, PV.PV_STRINGVALUE)) ASEGURADORA
from sysadm.property_values pv
LEFT JOIN  sysadm.objectlink obj ON pv.pv_key=obj.ol_r_property_value
WHERE PV_PROPERTY_DEF IN (3, 11, 12 , 13, 14, 15)
GROUP BY obj.ol_l_appointment) prop ON prop.ol_l_appointment=a.ap_key
LEFT OUTER JOIN sysadm.property_lovs pvl ON pvl.plv_code=prop.ASEGURADORA
where 1=1 and a.ap_ahd = 'A1'and a.ap_date between to_date('` + req.body.fechaI + `', 'dd/mm/yyyy') and to_date ('` + req.body.fechaF + `', 'dd/mm/yyyy')`;
    let result = await BD.Open(sql, [], false);
    Cites = [];
    previouscite = {}
    result.rows.map(cite => {
            let userSchema = {
                "id_Unico": cite[0],
                "tipo_ID": cite[1],
                "numero_ID": cite[2],
                "fehca_Nacimiento": cite[3],
                "Edad": cite[4],
                "Sexo": cite[5],
                "pimer_Ap": cite[6],
                "segundo_Ap": cite[7],
                "primer_Nom": cite[8],
                "segundo_Nom": cite[9],
                "telefono": cite[10],
                "celular": cite[11],
                "direccion": cite[12],
                "email": cite[13],
                "municipio": cite[14],
                "documento_Cita": cite[15],
                "fec_Solicitud_Cita": cite[16],
                "fecha_Cita": cite[17],
                "hora_Cita": cite[18],
                "tipo_Usuario": cite[19],
                "hora_Proceso": cite[20],
                "hora_Presentado": cite[21],
                "hora_Salida": cite[22],
                "regimen": cite[23],
                "mes": cite[24],
                "estado_Cita": cite[25],
                "motivo": cite[26],
                "codigo_Empresa": cite[27],
                "empresa": cite[28],
                "codigo_Consulta": cite[29],
                "desc_Consulta": cite[30],
                "epiinadia": cite[31],
                "desc_Diagnostico": cite[32],
                "tipo_Episodio": cite[33],
                "via_Sol_cita": cite[34],
                "nom_Usu_Adiciono_Cita": cite[35],
                "observaciones": cite[36]
            }
                Cites.push(userSchema);
        }
    )

    res.json(Cites);
})

module.exports = router;