
/*
void vertex_main
(
 $vertex_in.position vtx_pos,
 $material(float3) scale,
 $builtin.crworld_to_proj proj_from_crws,
 $particle.transform(space=crworld) crworld_from_particle,
 $vertex_out.position out_position
) {
    float3 vertexLocal = vtx_pos.xyz * scale;
    float3 pos_crws = vfx_transform_position(crworld_from_particle, vertexLocal);
    out_position = proj_from_crws * float4(pos_crws, 1);
}
*/

void fragment_main
(
 $fragment_out.color out_color,
 $fragment_in.color in_color,
 $vertex_out.uv0 in_uv,
 $material(float) red,
 $material(float4) myColorTint,
 $material(texture2d<half>) myTexture
) {
    sampler tex2DSampler(mag_filter::linear, min_filter::linear, mip_filter::linear, address::clamp_to_zero);
    
    half4 tex = myTexture.sample(tex2DSampler, in_uv);
    
    tex.rgb = tex.rgb * half3(myColorTint.rgb);
    
    half4 screen = 1.0h - (1.0h - tex)*(1.0h - in_color);
    
    screen = screen * myColorTint.a ;

    out_color = screen;    
}
