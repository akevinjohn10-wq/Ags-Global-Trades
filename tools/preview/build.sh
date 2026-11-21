set -e
cd /home/claude/ags-global-trades
NODE_PATH=/opt/npm-tools/node_modules /opt/npm-tools/node_modules/.bin/esbuild src/main.tsx --bundle --outfile=/tmp/site/app.js --jsx=automatic --loader:.svg=dataurl --loader:.png=dataurl --loader:.jpg=dataurl --loader:.webp=dataurl --alias:lucide-react=/tmp/site/shims/lucide.js --alias:@supabase/supabase-js=/tmp/site/shims/supabase.js --alias:@=./src --define:import.meta.env.VITE_SUPABASE_URL='""' --define:import.meta.env.VITE_SUPABASE_ANON_KEY='""' --define:process.env.NODE_ENV='"production"' --minify --log-level=warning
cd /tmp/site && node build-css.mjs
