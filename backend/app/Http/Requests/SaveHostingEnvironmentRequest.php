<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class SaveHostingEnvironmentRequest extends FormRequest { public function authorize():bool{return $this->user()?->can('update',$this->route('site'))??false;} public function rules():array{return ['scope'=>['required','in:laravel,node'],'variables'=>['nullable','array'],'variables.*'=>['nullable','string','max:10000'],'content'=>['nullable','string','max:200000']];} }
