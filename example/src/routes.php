<?php

use Slim\Http\Request;
use Slim\Http\Response;


defined('INFO_REQUEST_PATH') || define('INFO_REQUEST_PATH', 'settings.txt');
defined('REQUEST_STATUS_START') || define('REQUEST_STATUS_START', 0);
defined('REQUEST_STATUS_END') || define('REQUEST_STATUS_END', 1);
defined('REQUEST_STATUS_ERR') || define('REQUEST_STATUS_ERR', 2);

function registerRequest() {
    $key = uniqid();
    $infoRequestJson = file_get_contents(INFO_REQUEST_PATH);
    $arrInfoRequest = $infoRequestJson ? json_decode($infoRequestJson) : array();
    $arrInfoRequest[] = $key;
    $infoRequestJson = json_encode($arrInfoRequest);
    writeFileTest($infoRequestJson);
    return $key;
}

function countRequest() {
    $infoRequestJson = file_get_contents(INFO_REQUEST_PATH);
    $arrInfoRequest = $infoRequestJson ? json_decode($infoRequestJson) : array();
    return count($arrInfoRequest);
}

function unRegisterRequest($key) {
    $infoRequestJson = file_get_contents(INFO_REQUEST_PATH);
    $arrInfoRequest = $infoRequestJson ? json_decode($infoRequestJson) : array();
    $arrInfoRequest = array_diff($arrInfoRequest, array($key));
    $infoRequestJson = json_encode($arrInfoRequest);
    writeFileTest($infoRequestJson);
}

function writeFileTest($settings) {
    $fp = fopen(INFO_REQUEST_PATH, 'w+');
    if(!$fp) {
      trigger_error('file_put_contents cannot write in file.', E_USER_ERROR);
      return;
    }
    fputs($fp, $settings);
    fclose($fp);
}

function get_client_ip() {
    $ipaddress = '';
    if (getenv('HTTP_CLIENT_IP'))
        $ipaddress = getenv('HTTP_CLIENT_IP');
    else if(getenv('HTTP_X_FORWARDED_FOR'))
        $ipaddress = getenv('HTTP_X_FORWARDED_FOR');
    else if(getenv('HTTP_X_FORWARDED'))
        $ipaddress = getenv('HTTP_X_FORWARDED');
    else if(getenv('HTTP_FORWARDED_FOR'))
        $ipaddress = getenv('HTTP_FORWARDED_FOR');
    else if(getenv('HTTP_FORWARDED'))
        $ipaddress = getenv('HTTP_FORWARDED');
    else if(getenv('REMOTE_ADDR'))
        $ipaddress = getenv('REMOTE_ADDR');
    else
        $ipaddress = 'UNKNOWN';
 
    return $ipaddress;
}

// Routes
$app->get('/[{name}]', function (Request $request, Response $response, array $args) {
    // Sample log message
    $this->logger->info("Slim-Skeleton '/' route");

    // Render index view
    return $this->renderer->render($response, 'index.phtml', $args);
});

$app->get('/test/', function (Request $request, Response $response, array $args) {
    
    $count = countRequest();

    if ($count > 0) {
        return $response->withStatus(302)
                        ->withHeader('Location', 'http://192.168.1.128:8080/example/public/users/');
    }

    $key = registerRequest();

    try {
        sleep(10);
        
        unRegisterRequest($key);
        return $response->withStatus(203)
                        ->withJson(array(
                            'IP'   => get_client_ip(),
                            'TIME' => date('y-m-d h:i:s'),
                        ));
    } catch (Exception $e) {
        unRegisterRequest($key);
        return $response->withStatus(500);
    }
});

// Retrieve user with id
$app->get('/user/[{id}]', function (Request $request, Response $response, array $args) {
	$db = $this->db->prepare("SELECT * FROM tbluser WHERE id = :id");
	$db->bindParam("id", $args['id']);
	$db->execute();
	$user = $db->fetchObject();
	return $this->response->withJson($user);
});

// Add a new user
$app->post('/user', function (Request $request, Response $response) {
    $input = $request->getParsedBody();
    $sql = "INSERT INTO tbluser (`username`, `fullname`, `gender`, `position`, `department`, `del_flag`) VALUES (:username, :fullname, :gender, :position, :department, 0)";
    $db = $this->db->prepare($sql);
    $db->bindParam("username", $input['username']);
    $db->bindParam("fullname", $input['fullname']);
    $db->bindParam("gender", $input['gender']);
    $db->bindParam("position", $input['position']);
    $db->bindParam("department", $input['department']);
    $db->execute();
    $input['id'] = $this->db->lastInsertId();
    return $this->response->withJson($input);
});

// Update book with given id
$app->put('/user/[{id}]', function (Request $request, Response $response, array $args) {
    $input = $request->getParsedBody();
    $sql = "UPDATE tbluser SET username = :username, fullname = :fullname, gender = :gender, position = :position, department = :department, del_flag = :del_flag WHERE id = :id";
    $db = $this->db->prepare($sql);
    $db->bindParam("username", $input['username']);
    $db->bindParam("fullname", $input['fullname']);
    $db->bindParam("gender", $input['gender']);
    $db->bindParam("position", $input['position']);
    $db->bindParam("department", $input['department']);
    $db->bindParam("del_flag", $input['del_flag']);
    $db->bindParam("id", $args['id']);
    $db->execute();
    $input['id'] = $args['id'];
    return $this->response->withJson($input);
});

// DELETE a book with given id
$app->delete('/user/[{id}]', function (Request $request, Response $response, array $args) {
    $sth = $this->db->prepare("DELETE FROM tbluser WHERE id = :id");
    $sth->bindParam("id", $args['id']);
    $sth->execute();
    return $this->response->withJson();
});
