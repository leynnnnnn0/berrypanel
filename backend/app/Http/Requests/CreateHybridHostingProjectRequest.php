<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class CreateHybridHostingProjectRequest extends FormRequest {
 public function authorize():bool{return $this->user()!==null;}
 public function rules():array{return [
  'name'=>['required','string','max:62','regex:/^[A-Za-z0-9][A-Za-z0-9 -]*[A-Za-z0-9]$/'],
  'repository_url'=>['required','url','max:255','regex:/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/'],
  'backend_directory'=>['required','string','max:255','regex:/^\/(?!.*\.\.)(?:[A-Za-z0-9._-]+\/?)*$/'],
  'frontend_directory'=>['required','string','max:255','regex:/^\/(?!.*\.\.)(?:[A-Za-z0-9._-]+\/?)*$/'],
 ];}
}
