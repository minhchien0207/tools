<?php

use Slim\Http\Request;
use Slim\Http\Response;

// Routes

$app->get('/[{name}]', function (Request $request, Response $response, array $args) {
    // Sample log message
    $this->logger->info("Slim-Skeleton '/' route");

    // Render index view
    return $this->renderer->render($response, 'index.phtml', $args);
});

$app->get('/users/', function (Request $request, Response $response, array $args) {
    $db = $this->db->prepare("SELECT * FROM tbluser ORDER BY id LIMIT 10");
    $db->execute();
    $users = $db->fetchAll();
    return $response->withJson($users);
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
