const oracledb = require('oracledb');
oracledb.initOracleClient({libDir:'C:\\MisAplicaciones\\instantclient_23_5'});

database = {
    user: "HUSRT",
    password: "Hu5rtZ023T",
    connectString: "172.30.34.13:1521/QPROD"
}


async function Open(sql, binds, autoCommit) {
    let cnn = await oracledb.getConnection(database);
    let result = await cnn.execute(sql, binds, { autoCommit });
    cnn.release();
    return result;
}

exports.Open = Open;
