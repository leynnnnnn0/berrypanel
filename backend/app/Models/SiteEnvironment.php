<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class SiteEnvironment extends Model { protected $guarded=[]; protected function casts(): array { return ['variables'=>'encrypted:array']; } }
