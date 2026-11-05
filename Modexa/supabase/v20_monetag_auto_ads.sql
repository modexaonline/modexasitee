-- v20: Monetag auto ads. Safe to run more than once. Run in Supabase → SQL Editor.
-- 1) master ads switch ON, Monetag ON
-- 2) store the Monetag formats in the admin box (only if you have not saved your own yet)
-- The site also has these codes built in, so ads work even before this is run; this just makes them editable in Admin → Ads → Monetag.
update public.site_settings set
  ads_enabled = true,
  monetag_enabled = true,
  monetag_formats = case when jsonb_array_length(coalesce(monetag_formats, '[]'::jsonb)) = 0 and coalesce(monetag_code, '') = ''
    then $json$[
      {"id":"mt-push","format":"push","on":true,"code":"<script src=\"https://5gvci.com/act/files/tag.min.js?z=12169600\" data-cfasync=\"false\" async></script>"},
      {"id":"mt-inpage","format":"inpage","on":true,"code":"<script>(function(s){s.dataset.zone='12169599',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>"},
      {"id":"mt-vignette","format":"vignette","on":true,"code":"<script>(function(s){s.dataset.zone='12169597',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>"},
      {"id":"mt-popunder","format":"popunder","on":true,"code":"<script>(function(s){s.dataset.zone='12169594',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>"},
      {"id":"mt-multitag","format":"multitag","on":true,"code":"<script src=\"https://quge5.com/88/tag.min.js\" data-zone=\"304526\" async data-cfasync=\"false\"></script>"},
      {"id":"mt-smartlink","format":"smartlink","on":true,"code":"https://uplcm.com/4/12169598"}
    ]$json$::jsonb
    else monetag_formats end
where id = 1;
-- new posts already default to "Show ads on this post" = ON (posts.ads_enabled default true, see v5).
notify pgrst, 'reload schema';
