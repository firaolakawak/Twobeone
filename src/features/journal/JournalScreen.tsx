import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function JournalScreen() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) console.log(error);
      setItems(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={{ paddingVertical: 12 }}>
          <Text style={{ fontWeight: '600' }}>{item.title}</Text>
          <Text>{item.content}</Text>
        </View>
      )}
    />
  );
}
