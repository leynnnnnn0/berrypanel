<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class SiteService extends Model { protected $guarded=[]; protected function casts(): array { return ['enabled'=>'boolean','last_started_at'=>'datetime','last_stopped_at'=>'datetime']; } public function site(){return $this->belongsTo(Site::class);} }
